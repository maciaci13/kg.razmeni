-- Fix confirmation unlock flow and add participant leave/cancel flow.
-- Run after 003_fix_playground_seed.sql.

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
    set status = case when status in ('pending_confirmation', 'confirmed') then 'confirmed' else status end,
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

    update public.swap_requests
    set is_locked = true, lock_reason = 'confirmed_match'
    where id in (select request_id from public.match_participants where match_id = p_match_id);

    insert into public.match_progress_events (match_id, event_type, event_label)
    values (p_match_id, 'all_participants_confirmed', 'Всички страни потвърдиха интерес');

    insert into public.notifications (user_id, type, title, body, match_id)
    select user_id, 'chat_unlocked', 'Чатът е отключен', 'Всички страни потвърдиха интерес. Можете да координирате следващите стъпки.', p_match_id
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
      confirmation_status = case when confirmation_status = 'pending' then 'declined' else confirmation_status end,
      coordination_updated_at = now(),
      declined_at = case when confirmation_status = 'pending' then now() else declined_at end
  where id = participant_id;

  update public.swap_requests
  set is_locked = false, lock_reason = null
  where id in (select request_id from public.match_participants where match_id = p_match_id);

  update public.matches
  set status = case when p_keep_chat then 'at_risk' else 'cancelled' end,
      failure_reason = 'participant_left_match',
      cancelled_at = case when p_keep_chat then cancelled_at else now() end
  where id = p_match_id;

  if p_keep_chat then
    update public.chats
    set status = case when status = 'locked' then 'active' else status end,
        unlocked_at = coalesce(unlocked_at, now())
    where match_id = p_match_id and chat_type = 'group';
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
