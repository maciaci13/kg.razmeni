-- Add direct chats for every pair in a confirmed match and tighten chat permissions.
-- Run after 004_fix_confirm_and_leave_flow.sql.

create unique index if not exists one_direct_chat_per_pair_per_match
on public.chats (
  match_id,
  least(direct_user_1_id::text, direct_user_2_id::text),
  greatest(direct_user_1_id::text, direct_user_2_id::text)
)
where chat_type = 'direct';

create or replace function public.ensure_match_direct_chats(p_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  b record;
  chat_status_value chat_status;
  created_count integer := 0;
begin
  select case
    when exists (select 1 from public.chats where match_id = p_match_id and chat_type = 'group' and status = 'active') then 'active'::chat_status
    else 'locked'::chat_status
  end into chat_status_value;

  for a in
    select user_id, participant_order
    from public.match_participants
    where match_id = p_match_id
    order by participant_order
  loop
    for b in
      select user_id, participant_order
      from public.match_participants
      where match_id = p_match_id and participant_order > a.participant_order
      order by participant_order
    loop
      insert into public.chats (match_id, chat_type, direct_user_1_id, direct_user_2_id, status, unlocked_at)
      values (
        p_match_id,
        'direct',
        a.user_id,
        b.user_id,
        chat_status_value,
        case when chat_status_value = 'active' then now() else null end
      )
      on conflict do nothing;
      created_count := created_count + 1;
    end loop;
  end loop;

  return created_count;
end;
$$;

create or replace function public.confirm_match_participant(p_match_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_id uuid;
  current_status confirmation_status;
  remaining_count integer;
  group_chat_id uuid;
begin
  select id, confirmation_status into participant_id, current_status
  from public.match_participants
  where match_id = p_match_id and user_id = p_user_id;

  if participant_id is null then
    raise exception 'Participant not found for this match/user';
  end if;

  if current_status = 'declined' then
    raise exception 'Participant already declined this match';
  end if;

  update public.match_participants
  set confirmation_status = 'interested', confirmed_at = coalesce(confirmed_at, now())
  where id = participant_id;

  insert into public.match_progress_events (match_id, user_id, participant_id, event_type, event_label)
  values (p_match_id, p_user_id, participant_id, 'participant_confirmed', 'Потвърди интерес');

  select count(*) into remaining_count
  from public.match_participants
  where match_id = p_match_id and confirmation_status <> 'interested';

  if remaining_count = 0 then
    update public.matches
    set status = case when status in ('pending_confirmation', 'confirmed') then 'confirmed'::match_status else status end,
        confirmed_at = coalesce(confirmed_at, now())
    where id = p_match_id;

    update public.chats
    set status = 'active', unlocked_at = coalesce(unlocked_at, now()), archived_at = null
    where match_id = p_match_id and chat_type = 'group'
    returning id into group_chat_id;

    if group_chat_id is null then
      insert into public.chats (match_id, chat_type, status, unlocked_at)
      values (p_match_id, 'group', 'active', now())
      returning id into group_chat_id;
    end if;

    perform public.ensure_match_direct_chats(p_match_id);

    update public.chats
    set status = 'active', unlocked_at = coalesce(unlocked_at, now()), archived_at = null
    where match_id = p_match_id and chat_type = 'direct';

    update public.swap_requests
    set is_locked = true, lock_reason = 'confirmed_match'
    where id in (select request_id from public.match_participants where match_id = p_match_id);

    insert into public.match_progress_events (match_id, event_type, event_label)
    values (p_match_id, 'all_participants_confirmed', 'Всички страни потвърдиха интерес');

    insert into public.notifications (user_id, type, title, body, match_id)
    select user_id, 'chat_unlocked', 'Чатовете са отключени', 'Всички страни потвърдиха интерес. Можете да пишете в груповия чат или директно един към друг.', p_match_id
    from public.match_participants
    where match_id = p_match_id;
  else
    insert into public.notifications (user_id, type, title, body, match_id)
    select user_id, 'participant_confirmed', 'Участник потвърди интерес', 'Още една страна потвърди интерес към потенциалното съвпадение.', p_match_id
    from public.match_participants
    where match_id = p_match_id and user_id <> p_user_id;
  end if;

  return participant_id;
end;
$$;

create or replace function public.send_chat_message(p_chat_id uuid, p_sender_user_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  message_id uuid;
  msg text := trim(coalesce(p_body, ''));
  is_flagged boolean := false;
  match_id_value uuid;
  chat_record record;
begin
  if msg = '' then
    raise exception 'Empty message';
  end if;

  select * into chat_record
  from public.chats
  where id = p_chat_id and status = 'active';

  if chat_record.id is null then
    raise exception 'Chat is not active';
  end if;

  if chat_record.chat_type = 'group' then
    if not exists (
      select 1 from public.match_participants
      where match_id = chat_record.match_id and user_id = p_sender_user_id
    ) then
      raise exception 'Sender is not a participant in this group chat';
    end if;
  else
    if p_sender_user_id not in (chat_record.direct_user_1_id, chat_record.direct_user_2_id) then
      raise exception 'Sender is not a participant in this direct chat';
    end if;
  end if;

  match_id_value := chat_record.match_id;
  is_flagged := msg ~* '(пари|плащам|платя|купувам|продавам|колко искаш|ще ти дам|сума|оферта|срещу заплащане|възнаграждение)';

  insert into public.messages (chat_id, sender_user_id, body, moderation_flag, moderation_reason)
  values (p_chat_id, p_sender_user_id, msg, is_flagged, case when is_flagged then 'payment_related_terms' else null end)
  returning id into message_id;

  if is_flagged then
    insert into public.moderation_reports (reporter_user_id, reported_user_id, match_id, message_id, reason, details)
    values (p_sender_user_id, p_sender_user_id, match_id_value, message_id, 'money_offer', 'Automatic flag: payment-related words detected.');
  end if;

  if chat_record.chat_type = 'group' then
    insert into public.notifications (user_id, type, title, body, match_id)
    select mp.user_id, 'new_message', 'Ново съобщение в груповия чат', 'Имате ново съобщение в чата за координация.', match_id_value
    from public.match_participants mp
    where mp.match_id = match_id_value and mp.user_id <> p_sender_user_id;
  else
    insert into public.notifications (user_id, type, title, body, match_id)
    values (
      case when p_sender_user_id = chat_record.direct_user_1_id then chat_record.direct_user_2_id else chat_record.direct_user_1_id end,
      'new_direct_message',
      'Ново лично съобщение',
      'Имате ново лично съобщение за координация.',
      match_id_value
    );
  end if;

  return message_id;
end;
$$;

create or replace function public.leave_match(p_match_id uuid, p_user_id uuid, p_keep_chat boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_id uuid;
begin
  select id into participant_id
  from public.match_participants
  where match_id = p_match_id and user_id = p_user_id;

  if participant_id is null then
    raise exception 'Participant not found for this match/user';
  end if;

  update public.match_participants
  set coordination_status = 'dropped_out',
      confirmation_status = case when confirmation_status = 'pending' then 'declined'::confirmation_status else confirmation_status end,
      coordination_updated_at = now(),
      declined_at = case when confirmation_status = 'pending' then now() else declined_at end
  where id = participant_id;

  update public.swap_requests
  set is_locked = false, lock_reason = null
  where id in (select request_id from public.match_participants where match_id = p_match_id);

  update public.matches
  set status = case when p_keep_chat then 'at_risk'::match_status else 'cancelled'::match_status end,
      failure_reason = 'participant_left_match',
      cancelled_at = case when p_keep_chat then cancelled_at else now() end
  where id = p_match_id;

  if p_keep_chat then
    update public.chats
    set status = case when status = 'locked' then 'active'::chat_status else status end,
        unlocked_at = coalesce(unlocked_at, now())
    where match_id = p_match_id;
  else
    update public.chats
    set status = 'archived', archived_at = now()
    where match_id = p_match_id;
  end if;

  insert into public.match_progress_events (match_id, user_id, participant_id, event_type, event_label)
  values (p_match_id, p_user_id, participant_id, 'participant_left', 'Участник се отказа от координацията');

  insert into public.notifications (user_id, type, title, body, match_id)
  select user_id, 'participant_left', 'Участник се отказа', 'Една от страните се отказа от потенциалното съвпадение.', p_match_id
  from public.match_participants
  where match_id = p_match_id and user_id <> p_user_id;
end;
$$;
