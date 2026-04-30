-- МястоЗаМясто / kg.razmeni
-- Initial Supabase schema for MVP matching, chat, playground simulation, and safety flows.
-- Run this file in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- =========================
-- ENUMS
-- =========================
do $$ begin
  create type request_type as enum ('nursery', 'kindergarten', 'preschool');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('accepted_not_enrolled', 'enrolled', 'seeking_relocation', 'exploring');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_visibility as enum ('private_until_match', 'visible_to_matched_only');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_type as enum ('direct_2', 'cycle_3', 'cycle_4');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('pending_confirmation', 'confirmed', 'declined', 'expired', 'coordination_in_progress', 'completed_success', 'completed_failed', 'cancelled', 'admin_review', 'at_risk');
exception when duplicate_object then null; end $$;

do $$ begin
  create type confirmation_status as enum ('pending', 'interested', 'declined', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coordination_status as enum ('not_started', 'checking_procedure', 'contacted_kindergarten', 'can_continue', 'cannot_continue', 'completed', 'dropped_out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_type as enum ('group', 'direct');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_status as enum ('locked', 'active', 'archived', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum ('money_offer', 'harassment', 'false_information', 'child_personal_data', 'suspected_fraud', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type consent_type as enum ('terms', 'privacy', 'no_child_data', 'no_guarantee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_result as enum ('successful', 'in_progress', 'failed', 'other_side_declined', 'no_response', 'problem', 'other');
exception when duplicate_object then null; end $$;

-- =========================
-- HELPERS
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- TABLES
-- =========================
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text unique,
  display_name text not null,
  phone_optional text,
  email_verified boolean not null default false,
  is_blocked boolean not null default false,
  is_playground boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.kindergartens (
  id uuid primary key default gen_random_uuid(),
  official_number text,
  name text not null,
  normalized_name text,
  district text,
  address text,
  phone text,
  email text,
  website text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_active boolean not null default true,
  source_name text,
  source_url text,
  source_updated_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  from_kindergarten_id uuid not null references public.kindergartens(id) on delete restrict,
  request_type request_type not null,
  child_group_year_or_age_group text not null,
  status request_status not null default 'exploring',
  visibility request_visibility not null default 'private_until_match',
  is_active boolean not null default true,
  is_locked boolean not null default false,
  lock_reason text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint swap_requests_lock_reason_check check ((is_locked = false and lock_reason is null) or (is_locked = true))
);

create table if not exists public.swap_request_wanted_kindergartens (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.swap_requests(id) on delete cascade,
  wanted_kindergarten_id uuid not null references public.kindergartens(id) on delete restrict,
  priority_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique (request_id, wanted_kindergarten_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_type match_type not null,
  match_cycle_key text unique not null,
  status match_status not null default 'pending_confirmation',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text
);

create table if not exists public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  request_id uuid not null references public.swap_requests(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  participant_label text not null,
  participant_order integer not null,
  from_kindergarten_id uuid not null references public.kindergartens(id) on delete restrict,
  wants_kindergarten_id uuid not null references public.kindergartens(id) on delete restrict,
  receives_potential_kindergarten_id uuid not null references public.kindergartens(id) on delete restrict,
  confirmation_status confirmation_status not null default 'pending',
  coordination_status coordination_status not null default 'not_started',
  confirmed_at timestamptz,
  declined_at timestamptz,
  coordination_updated_at timestamptz,
  unique (match_id, request_id),
  unique (match_id, participant_order)
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  chat_type chat_type not null default 'group',
  direct_user_1_id uuid references public.app_users(id) on delete cascade,
  direct_user_2_id uuid references public.app_users(id) on delete cascade,
  status chat_status not null default 'locked',
  created_at timestamptz not null default now(),
  unlocked_at timestamptz,
  archived_at timestamptz,
  constraint direct_chat_users_check check (
    (chat_type = 'group' and direct_user_1_id is null and direct_user_2_id is null)
    or
    (chat_type = 'direct' and direct_user_1_id is not null and direct_user_2_id is not null and direct_user_1_id <> direct_user_2_id)
  )
);

create unique index if not exists one_group_chat_per_match on public.chats(match_id) where chat_type = 'group';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_user_id uuid not null references public.app_users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  moderation_flag boolean not null default false,
  moderation_reason text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  match_id uuid references public.matches(id) on delete cascade,
  request_id uuid references public.swap_requests(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.app_users(id) on delete cascade,
  reported_user_id uuid references public.app_users(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  request_id uuid references public.swap_requests(id) on delete set null,
  reason report_reason not null,
  details text,
  status report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.match_progress_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  participant_id uuid references public.match_participants(id) on delete set null,
  event_type text not null,
  event_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  consent_type consent_type not null,
  version text not null,
  accepted_at timestamptz not null default now()
);

create table if not exists public.match_feedback (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  result feedback_result not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (match_id, user_id)
);

-- =========================
-- INDEXES
-- =========================
create index if not exists idx_app_users_auth_user_id on public.app_users(auth_user_id);
create index if not exists idx_app_users_playground on public.app_users(is_playground);
create index if not exists idx_kindergartens_active on public.kindergartens(is_active);
create index if not exists idx_kindergartens_district on public.kindergartens(district);
create index if not exists idx_swap_requests_active on public.swap_requests(is_active, is_locked, expires_at);
create index if not exists idx_swap_requests_from on public.swap_requests(from_kindergarten_id);
create index if not exists idx_swap_requests_user on public.swap_requests(user_id);
create index if not exists idx_wanted_kindergartens_wanted on public.swap_request_wanted_kindergartens(wanted_kindergarten_id);
create index if not exists idx_matches_status on public.matches(status);
create index if not exists idx_match_participants_user on public.match_participants(user_id);
create index if not exists idx_match_participants_match on public.match_participants(match_id);
create index if not exists idx_chats_match on public.chats(match_id);
create index if not exists idx_messages_chat_created on public.messages(chat_id, created_at);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- =========================
-- TRIGGERS
-- =========================
drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();

drop trigger if exists trg_kindergartens_updated_at on public.kindergartens;
create trigger trg_kindergartens_updated_at before update on public.kindergartens for each row execute function public.set_updated_at();

drop trigger if exists trg_swap_requests_updated_at on public.swap_requests;
create trigger trg_swap_requests_updated_at before update on public.swap_requests for each row execute function public.set_updated_at();

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at before update on public.matches for each row execute function public.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.app_users enable row level security;
alter table public.kindergartens enable row level security;
alter table public.swap_requests enable row level security;
alter table public.swap_request_wanted_kindergartens enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.match_progress_events enable row level security;
alter table public.consent_logs enable row level security;
alter table public.match_feedback enable row level security;

-- Public read for active kindergarten directory.
drop policy if exists "active kindergartens are readable" on public.kindergartens;
create policy "active kindergartens are readable"
  on public.kindergartens for select
  using (is_active = true);

-- App users can read/update their own profile when linked to auth.
drop policy if exists "users can read own profile" on public.app_users;
create policy "users can read own profile"
  on public.app_users for select
  using (auth.uid() = auth_user_id);

drop policy if exists "users can update own profile" on public.app_users;
create policy "users can update own profile"
  on public.app_users for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Requests: owners can manage their own.
drop policy if exists "users can read own requests" on public.swap_requests;
create policy "users can read own requests"
  on public.swap_requests for select
  using (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

drop policy if exists "users can insert own requests" on public.swap_requests;
create policy "users can insert own requests"
  on public.swap_requests for insert
  with check (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

drop policy if exists "users can update own requests" on public.swap_requests;
create policy "users can update own requests"
  on public.swap_requests for update
  using (user_id in (select id from public.app_users where auth_user_id = auth.uid()))
  with check (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

-- Wanted KGs: owners via parent request.
drop policy if exists "users can manage own wanted kindergartens" on public.swap_request_wanted_kindergartens;
create policy "users can manage own wanted kindergartens"
  on public.swap_request_wanted_kindergartens for all
  using (request_id in (select sr.id from public.swap_requests sr join public.app_users au on au.id = sr.user_id where au.auth_user_id = auth.uid()))
  with check (request_id in (select sr.id from public.swap_requests sr join public.app_users au on au.id = sr.user_id where au.auth_user_id = auth.uid()));

-- Matches and participants visible only to involved participants.
drop policy if exists "participants can read own matches" on public.matches;
create policy "participants can read own matches"
  on public.matches for select
  using (id in (
    select mp.match_id from public.match_participants mp
    join public.app_users au on au.id = mp.user_id
    where au.auth_user_id = auth.uid()
  ));

drop policy if exists "participants can read match participants" on public.match_participants;
create policy "participants can read match participants"
  on public.match_participants for select
  using (match_id in (
    select mp.match_id from public.match_participants mp
    join public.app_users au on au.id = mp.user_id
    where au.auth_user_id = auth.uid()
  ));

-- Chats/messages visible to participants.
drop policy if exists "participants can read chats" on public.chats;
create policy "participants can read chats"
  on public.chats for select
  using (match_id in (
    select mp.match_id from public.match_participants mp
    join public.app_users au on au.id = mp.user_id
    where au.auth_user_id = auth.uid()
  ));

drop policy if exists "participants can read messages" on public.messages;
create policy "participants can read messages"
  on public.messages for select
  using (chat_id in (
    select c.id from public.chats c
    join public.match_participants mp on mp.match_id = c.match_id
    join public.app_users au on au.id = mp.user_id
    where au.auth_user_id = auth.uid()
  ));

-- Notifications: owner only.
drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
  on public.notifications for select
  using (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

-- Reports/consent/feedback: owner insert/read own.
drop policy if exists "users can insert reports" on public.moderation_reports;
create policy "users can insert reports"
  on public.moderation_reports for insert
  with check (reporter_user_id in (select id from public.app_users where auth_user_id = auth.uid()));

drop policy if exists "users can read own consent logs" on public.consent_logs;
create policy "users can read own consent logs"
  on public.consent_logs for select
  using (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

drop policy if exists "users can insert own consent logs" on public.consent_logs;
create policy "users can insert own consent logs"
  on public.consent_logs for insert
  with check (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

drop policy if exists "users can manage own feedback" on public.match_feedback;
create policy "users can manage own feedback"
  on public.match_feedback for all
  using (user_id in (select id from public.app_users where auth_user_id = auth.uid()))
  with check (user_id in (select id from public.app_users where auth_user_id = auth.uid()));

-- Note: Playground/admin operations will use service-role API routes, not public RLS.
