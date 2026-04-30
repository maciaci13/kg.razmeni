-- МястоЗаМясто / kg.razmeni
-- Matching RPC functions + playground seed/reset helpers.
-- Run after 001_initial_schema.sql.

-- =========================
-- MATCHING HELPERS
-- =========================
create or replace function public.are_age_groups_compatible(a text, b text)
returns boolean
language sql
stable
as $$
  select a = b;
$$;

create or replace function public.compute_match_cycle_key(p_match_type match_type, p_request_ids uuid[])
returns text
language sql
stable
as $$
  select p_match_type::text || ':' || string_agg(x::text, '-' order by x::text)
  from unnest(p_request_ids) as x;
$$;

create or replace function public.compute_confidence_score(p_match_type match_type, p_min_priority integer default 1)
returns integer
language plpgsql
stable
as $$
declare
  score integer := 90;
begin
  if p_match_type = 'cycle_3' then
    score := score - 10;
  elsif p_match_type = 'cycle_4' then
    score := score - 20;
  end if;

  if coalesce(p_min_priority, 1) = 1 then
    score := score + 10;
  end if;

  if score > 100 then score := 100; end if;
  if score < 0 then score := 0; end if;
  return score;
end;
$$;

create or replace function public.is_request_eligible(p_request_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.swap_requests sr
    join public.app_users au on au.id = sr.user_id
    join public.kindergartens kg on kg.id = sr.from_kindergarten_id
    where sr.id = p_request_id
      and sr.is_active = true
      and sr.is_locked = false
      and sr.deleted_at is null
      and sr.expires_at > now()
      and au.is_blocked = false
      and au.email_verified = true
      and kg.is_active = true
  );
$$;

create or replace function public.create_potential_match(
  p_match_type match_type,
  p_request_ids uuid[],
  p_wants_ids uuid[],
  p_min_priority integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cycle_key text;
  existing_id uuid;
  new_match_id uuid;
  req_id uuid;
  req_record record;
  i integer;
  label text;
  confidence integer;
begin
  if array_length(p_request_ids, 1) is null or array_length(p_wants_ids, 1) is null then
    return null;
  end if;

  if array_length(p_request_ids, 1) <> array_length(p_wants_ids, 1) then
    raise exception 'request_ids and wants_ids length mismatch';
  end if;

  if p_match_type = 'direct_2' and array_length(p_request_ids, 1) <> 2 then
    raise exception 'direct_2 requires 2 requests';
  end if;
  if p_match_type = 'cycle_3' and array_length(p_request_ids, 1) <> 3 then
    raise exception 'cycle_3 requires 3 requests';
  end if;
  if p_match_type = 'cycle_4' and array_length(p_request_ids, 1) <> 4 then
    raise exception 'cycle_4 requires 4 requests';
  end if;

  -- Every request must be eligible.
  foreach req_id in array p_request_ids loop
    if not public.is_request_eligible(req_id) then
      return null;
    end if;
  end loop;

  -- Prevent same user twice in one cycle.
  if (
    select count(distinct user_id) from public.swap_requests where id = any(p_request_ids)
  ) <> array_length(p_request_ids, 1) then
    return null;
  end if;

  cycle_key := public.compute_match_cycle_key(p_match_type, p_request_ids);

  select id into existing_id
  from public.matches
  where match_cycle_key = cycle_key
    and status in ('pending_confirmation', 'confirmed', 'coordination_in_progress', 'admin_review', 'at_risk')
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  confidence := public.compute_confidence_score(p_match_type, p_min_priority);

  insert into public.matches (match_type, match_cycle_key, status, confidence_score)
  values (p_match_type, cycle_key, 'pending_confirmation', confidence)
  returning id into new_match_id;

  for i in 1..array_length(p_request_ids, 1) loop
    select sr.*, au.id as participant_user_id
    into req_record
    from public.swap_requests sr
    join public.app_users au on au.id = sr.user_id
    where sr.id = p_request_ids[i];

    label := 'Родител ' || chr(64 + i);

    insert into public.match_participants (
      match_id,
      request_id,
      user_id,
      participant_label,
      participant_order,
      from_kindergarten_id,
      wants_kindergarten_id,
      receives_potential_kindergarten_id
    ) values (
      new_match_id,
      p_request_ids[i],
      req_record.participant_user_id,
      label,
      i,
      req_record.from_kindergarten_id,
      p_wants_ids[i],
      p_wants_ids[i]
    );

    insert into public.notifications (user_id, type, title, body, match_id, request_id)
    values (
      req_record.participant_user_id,
      'match_created',
      case when p_match_type = 'direct_2' then 'Намерихме потенциално съвпадение' else 'Намерихме верижно потенциално съвпадение' end,
      case when p_match_type = 'direct_2' then 'Има заявка, която може да съвпада с твоята. Потвърди интерес, за да продължиш.' else 'Има възможна координация между няколко заявки. Потвърди интерес, за да продължиш.' end,
      new_match_id,
      p_request_ids[i]
    );
  end loop;

  insert into public.chats (match_id, chat_type, status)
  values (new_match_id, 'group', 'locked')
  on conflict do nothing;

  insert into public.match_progress_events (match_id, event_type, event_label)
  values (new_match_id, 'match_created', 'Намерихме потенциално съвпадение');

  return new_match_id;
end;
$$;

-- =========================
-- FIND MATCHES
-- =========================
create or replace function public.find_potential_matches_for_request(p_request_id uuid)
returns table(match_id uuid, match_type match_type)
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  aw record;
  b record;
  bw record;
  c record;
  cw record;
  d record;
  created_id uuid;
begin
  if not public.is_request_eligible(p_request_id) then
    return;
  end if;

  select * into a from public.swap_requests where id = p_request_id;

  -- 2-way: A -> B and B -> A
  for aw in
    select wanted_kindergarten_id, priority_order
    from public.swap_request_wanted_kindergartens
    where request_id = a.id
  loop
    for b in
      select sr.*
      from public.swap_requests sr
      join public.app_users au on au.id = sr.user_id
      join public.swap_request_wanted_kindergartens bw2 on bw2.request_id = sr.id
      where sr.from_kindergarten_id = aw.wanted_kindergarten_id
        and bw2.wanted_kindergarten_id = a.from_kindergarten_id
        and sr.id <> a.id
        and sr.user_id <> a.user_id
        and sr.request_type = a.request_type
        and public.are_age_groups_compatible(sr.child_group_year_or_age_group, a.child_group_year_or_age_group)
        and public.is_request_eligible(sr.id)
    loop
      created_id := public.create_potential_match('direct_2', array[a.id, b.id], array[aw.wanted_kindergarten_id, a.from_kindergarten_id], aw.priority_order);
      if created_id is not null then
        match_id := created_id;
        match_type := 'direct_2';
        return next;
      end if;
    end loop;
  end loop;

  -- 3-way: A -> B -> C -> A
  for aw in
    select wanted_kindergarten_id, priority_order
    from public.swap_request_wanted_kindergartens
    where request_id = a.id
  loop
    for b in
      select sr.*
      from public.swap_requests sr
      where sr.from_kindergarten_id = aw.wanted_kindergarten_id
        and sr.id <> a.id
        and sr.user_id <> a.user_id
        and sr.request_type = a.request_type
        and public.are_age_groups_compatible(sr.child_group_year_or_age_group, a.child_group_year_or_age_group)
        and public.is_request_eligible(sr.id)
    loop
      for bw in
        select wanted_kindergarten_id, priority_order
        from public.swap_request_wanted_kindergartens
        where request_id = b.id
          and wanted_kindergarten_id <> a.from_kindergarten_id
      loop
        for c in
          select sr.*
          from public.swap_requests sr
          join public.swap_request_wanted_kindergartens cw2 on cw2.request_id = sr.id
          where sr.from_kindergarten_id = bw.wanted_kindergarten_id
            and cw2.wanted_kindergarten_id = a.from_kindergarten_id
            and sr.id <> a.id and sr.id <> b.id
            and sr.user_id <> a.user_id and sr.user_id <> b.user_id
            and sr.request_type = a.request_type
            and public.are_age_groups_compatible(sr.child_group_year_or_age_group, a.child_group_year_or_age_group)
            and public.is_request_eligible(sr.id)
        loop
          created_id := public.create_potential_match('cycle_3', array[a.id, b.id, c.id], array[aw.wanted_kindergarten_id, bw.wanted_kindergarten_id, a.from_kindergarten_id], least(aw.priority_order, bw.priority_order));
          if created_id is not null then
            match_id := created_id;
            match_type := 'cycle_3';
            return next;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  -- 4-way: A -> B -> C -> D -> A
  for aw in
    select wanted_kindergarten_id, priority_order
    from public.swap_request_wanted_kindergartens
    where request_id = a.id
  loop
    for b in
      select sr.*
      from public.swap_requests sr
      where sr.from_kindergarten_id = aw.wanted_kindergarten_id
        and sr.id <> a.id
        and sr.user_id <> a.user_id
        and sr.request_type = a.request_type
        and public.are_age_groups_compatible(sr.child_group_year_or_age_group, a.child_group_year_or_age_group)
        and public.is_request_eligible(sr.id)
    loop
      for bw in
        select wanted_kindergarten_id, priority_order
        from public.swap_request_wanted_kindergartens
        where request_id = b.id
          and wanted_kindergarten_id <> a.from_kindergarten_id
      loop
        for c in
          select sr.*
          from public.swap_requests sr
          where sr.from_kindergarten_id = bw.wanted_kindergarten_id
            and sr.id <> a.id and sr.id <> b.id
            and sr.user_id <> a.user_id and sr.user_id <> b.user_id
            and sr.request_type = a.request_type
            and public.are_age_groups_compatible(sr.child_group_year_or_age_group, a.child_group_year_or_age_group)
            and public.is_request_eligible(sr.id)
        loop
          for cw in
            select wanted_kindergarten_id, priority_order
            from public.swap_request_wanted_kindergartens
            where request_id = c.id
              and wanted_kindergarten_id <> a.from_kindergarten_id
              and wanted_kindergarten_id <> b.from_kindergarten_id
          loop
            for d in
              select sr.*
              from public.swap_requests sr
              join public.swap_request_wanted_kindergartens dw2 on dw2.request_id = sr.id
              where sr.from_kindergarten_id = cw.wanted_kindergarten_id
                and dw2.wanted_kindergarten_id = a.from_kindergarten_id
                and sr.id <> a.id and sr.id <> b.id and sr.id <> c.id
                and sr.user_id <> a.user_id and sr.user_id <> b.user_id and sr.user_id <> c.user_id
                and sr.request_type = a.request_type
                and public.are_age_groups_compatible(sr.child_group_year_or_age_group, a.child_group_year_or_age_group)
                and public.is_request_eligible(sr.id)
            loop
              created_id := public.create_potential_match('cycle_4', array[a.id, b.id, c.id, d.id], array[aw.wanted_kindergarten_id, bw.wanted_kindergarten_id, cw.wanted_kindergarten_id, a.from_kindergarten_id], least(aw.priority_order, bw.priority_order, cw.priority_order));
              if created_id is not null then
                match_id := created_id;
                match_type := 'cycle_4';
                return next;
              end if;
            end loop;
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
end;
$$;

create or replace function public.run_matching_for_active_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  created_count integer := 0;
  before_count integer;
  after_count integer;
begin
  select count(*) into before_count from public.matches;

  for r in
    select sr.id
    from public.swap_requests sr
    where public.is_request_eligible(sr.id)
    order by sr.created_at desc
  loop
    perform * from public.find_potential_matches_for_request(r.id);
  end loop;

  select count(*) into after_count from public.matches;
  created_count := after_count - before_count;
  return created_count;
end;
$$;

-- =========================
-- CONFIRMATION / CHAT / STATUS
-- =========================
create or replace function public.confirm_match_participant(p_match_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_id uuid;
  remaining_count integer;
  group_chat_id uuid;
begin
  select id into participant_id
  from public.match_participants
  where match_id = p_match_id and user_id = p_user_id;

  if participant_id is null then
    raise exception 'Participant not found for this match/user';
  end if;

  update public.match_participants
  set confirmation_status = 'interested', confirmed_at = now()
  where id = participant_id and confirmation_status = 'pending';

  insert into public.match_progress_events (match_id, user_id, participant_id, event_type, event_label)
  values (p_match_id, p_user_id, participant_id, 'participant_confirmed', 'Потвърди интерес');

  select count(*) into remaining_count
  from public.match_participants
  where match_id = p_match_id and confirmation_status <> 'interested';

  if remaining_count = 0 then
    update public.matches
    set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
    where id = p_match_id and status = 'pending_confirmation';

    update public.chats
    set status = 'active', unlocked_at = coalesce(unlocked_at, now())
    where match_id = p_match_id and chat_type = 'group'
    returning id into group_chat_id;

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

create or replace function public.decline_match_participant(p_match_id uuid, p_user_id uuid)
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
  set confirmation_status = 'declined', declined_at = now()
  where id = participant_id;

  update public.matches
  set status = 'declined', failure_reason = 'participant_declined_before_confirmation'
  where id = p_match_id;

  update public.chats
  set status = 'archived', archived_at = now()
  where match_id = p_match_id;

  insert into public.match_progress_events (match_id, user_id, participant_id, event_type, event_label)
  values (p_match_id, p_user_id, participant_id, 'participant_declined', 'Отказа интерес');

  insert into public.notifications (user_id, type, title, body, match_id)
  select user_id, 'match_declined', 'Съвпадението отпадна', 'Една от страните отказа интерес. Ще продължим да търсим други потенциални съвпадения.', p_match_id
  from public.match_participants
  where match_id = p_match_id and user_id <> p_user_id;
end;
$$;

create or replace function public.update_my_coordination_status(p_match_id uuid, p_user_id uuid, p_status coordination_status)
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
  set coordination_status = p_status, coordination_updated_at = now()
  where id = participant_id;

  insert into public.match_progress_events (match_id, user_id, participant_id, event_type, event_label)
  values (p_match_id, p_user_id, participant_id, 'coordination_status_updated', 'Обнови своя статус');

  if exists (
    select 1 from public.match_participants
    where match_id = p_match_id and coordination_status in ('cannot_continue', 'dropped_out')
  ) then
    update public.matches
    set status = 'at_risk'
    where id = p_match_id and status in ('confirmed', 'coordination_in_progress');
  elsif not exists (
    select 1 from public.match_participants
    where match_id = p_match_id and coordination_status <> 'can_continue'
  ) then
    update public.matches
    set status = 'coordination_in_progress'
    where id = p_match_id and status = 'confirmed';
  end if;
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
begin
  if msg = '' then
    raise exception 'Empty message';
  end if;

  select c.match_id into match_id_value
  from public.chats c
  join public.match_participants mp on mp.match_id = c.match_id and mp.user_id = p_sender_user_id
  where c.id = p_chat_id and c.status = 'active'
  limit 1;

  if match_id_value is null then
    raise exception 'Chat is not active or sender is not a participant';
  end if;

  is_flagged := msg ~* '(пари|плащам|платя|купувам|продавам|колко искаш|ще ти дам|сума|оферта|срещу заплащане|възнаграждение)';

  insert into public.messages (chat_id, sender_user_id, body, moderation_flag, moderation_reason)
  values (p_chat_id, p_sender_user_id, msg, is_flagged, case when is_flagged then 'payment_related_terms' else null end)
  returning id into message_id;

  if is_flagged then
    insert into public.moderation_reports (reporter_user_id, reported_user_id, match_id, message_id, reason, details)
    values (p_sender_user_id, p_sender_user_id, match_id_value, message_id, 'money_offer', 'Automatic flag: payment-related words detected.');
  end if;

  insert into public.notifications (user_id, type, title, body, match_id)
  select mp.user_id, 'new_message', 'Ново съобщение', 'Имате ново съобщение в чата за координация.', match_id_value
  from public.match_participants mp
  where mp.match_id = match_id_value and mp.user_id <> p_sender_user_id;

  return message_id;
end;
$$;

-- =========================
-- EXPIRATION
-- =========================
create or replace function public.expire_pending_matches()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.matches
  set status = 'expired'
  where status = 'pending_confirmation' and expires_at < now();
  get diagnostics affected = row_count;

  update public.match_participants
  set confirmation_status = 'expired'
  where match_id in (select id from public.matches where status = 'expired')
    and confirmation_status = 'pending';

  update public.chats
  set status = 'archived', archived_at = now()
  where match_id in (select id from public.matches where status = 'expired')
    and status = 'locked';

  return affected;
end;
$$;

create or replace function public.expire_old_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.swap_requests
  set is_active = false
  where is_active = true and expires_at < now() and is_locked = false;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- =========================
-- PLAYGROUND
-- =========================
create or replace function public.reset_playground_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.matches
  where id in (
    select distinct mp.match_id
    from public.match_participants mp
    join public.app_users au on au.id = mp.user_id
    where au.is_playground = true
  );

  delete from public.swap_requests
  where user_id in (select id from public.app_users where is_playground = true);

  delete from public.app_users where is_playground = true;
  delete from public.kindergartens where source_name = 'playground';
end;
$$;

create or replace function public.seed_playground_base()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  kg1 uuid;
  kg2 uuid;
  kg3 uuid;
  kg4 uuid;
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
begin
  perform public.reset_playground_data();

  insert into public.kindergartens (official_number, name, normalized_name, district, address, phone, email, latitude, longitude, source_name, last_verified_at)
  values
    ('PG-1', 'ДГ „Слънце“', 'дг слънце', 'Изгрев', 'ул. Тестова 1', '02 000 0001', 'sun@example.local', 42.6701000, 23.3501000, 'playground', now()),
    ('PG-2', 'ДГ „Дъга“', 'дг дъга', 'Лозенец', 'ул. Тестова 2', '02 000 0002', 'rainbow@example.local', 42.6761000, 23.3221000, 'playground', now()),
    ('PG-3', 'ДГ „Мечо Пух“', 'дг мечо пух', 'Красно село', 'ул. Тестова 3', '02 000 0003', 'pooh@example.local', 42.6831000, 23.2901000, 'playground', now()),
    ('PG-4', 'ДГ „Вълшебство“', 'дг вълшебство', 'Младост', 'ул. Тестова 4', '02 000 0004', 'magic@example.local', 42.6501000, 23.3801000, 'playground', now())
  returning id into kg4;

  select id into kg1 from public.kindergartens where official_number = 'PG-1' and source_name = 'playground';
  select id into kg2 from public.kindergartens where official_number = 'PG-2' and source_name = 'playground';
  select id into kg3 from public.kindergartens where official_number = 'PG-3' and source_name = 'playground';
  select id into kg4 from public.kindergartens where official_number = 'PG-4' and source_name = 'playground';

  insert into public.app_users (email, display_name, email_verified, is_playground)
  values
    ('test-parent-a@playground.local', 'Родител A', true, true),
    ('test-parent-b@playground.local', 'Родител B', true, true),
    ('test-parent-c@playground.local', 'Родител C', true, true),
    ('test-parent-d@playground.local', 'Родител D', true, true);

  select id into u1 from public.app_users where email = 'test-parent-a@playground.local';
  select id into u2 from public.app_users where email = 'test-parent-b@playground.local';
  select id into u3 from public.app_users where email = 'test-parent-c@playground.local';
  select id into u4 from public.app_users where email = 'test-parent-d@playground.local';

  return jsonb_build_object(
    'kindergartens', jsonb_build_array(kg1, kg2, kg3, kg4),
    'users', jsonb_build_array(u1, u2, u3, u4)
  );
end;
$$;

create or replace function public.seed_playground_cycle(p_cycle_size integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  base jsonb;
  kg1 uuid;
  kg2 uuid;
  kg3 uuid;
  kg4 uuid;
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
  r1 uuid;
  r2 uuid;
  r3 uuid;
  r4 uuid;
  created integer;
begin
  if p_cycle_size not in (2,3,4) then
    raise exception 'p_cycle_size must be 2, 3, or 4';
  end if;

  base := public.seed_playground_base();

  kg1 := (base->'kindergartens'->>0)::uuid;
  kg2 := (base->'kindergartens'->>1)::uuid;
  kg3 := (base->'kindergartens'->>2)::uuid;
  kg4 := (base->'kindergartens'->>3)::uuid;
  u1 := (base->'users'->>0)::uuid;
  u2 := (base->'users'->>1)::uuid;
  u3 := (base->'users'->>2)::uuid;
  u4 := (base->'users'->>3)::uuid;

  insert into public.swap_requests (user_id, from_kindergarten_id, request_type, child_group_year_or_age_group, status)
  values (u1, kg1, 'kindergarten', '2019', 'enrolled') returning id into r1;
  insert into public.swap_requests (user_id, from_kindergarten_id, request_type, child_group_year_or_age_group, status)
  values (u2, kg2, 'kindergarten', '2019', 'enrolled') returning id into r2;

  if p_cycle_size >= 3 then
    insert into public.swap_requests (user_id, from_kindergarten_id, request_type, child_group_year_or_age_group, status)
    values (u3, kg3, 'kindergarten', '2019', 'enrolled') returning id into r3;
  end if;

  if p_cycle_size = 4 then
    insert into public.swap_requests (user_id, from_kindergarten_id, request_type, child_group_year_or_age_group, status)
    values (u4, kg4, 'kindergarten', '2019', 'enrolled') returning id into r4;
  end if;

  if p_cycle_size = 2 then
    insert into public.swap_request_wanted_kindergartens (request_id, wanted_kindergarten_id, priority_order) values
      (r1, kg2, 1),
      (r2, kg1, 1);
  elsif p_cycle_size = 3 then
    insert into public.swap_request_wanted_kindergartens (request_id, wanted_kindergarten_id, priority_order) values
      (r1, kg2, 1),
      (r2, kg3, 1),
      (r3, kg1, 1);
  else
    insert into public.swap_request_wanted_kindergartens (request_id, wanted_kindergarten_id, priority_order) values
      (r1, kg2, 1),
      (r2, kg3, 1),
      (r3, kg4, 1),
      (r4, kg1, 1);
  end if;

  created := public.run_matching_for_active_requests();

  return jsonb_build_object(
    'cycle_size', p_cycle_size,
    'created_matches_count', created,
    'requests', jsonb_build_array(r1, r2, r3, r4),
    'users', jsonb_build_array(u1, u2, u3, u4)
  );
end;
$$;
