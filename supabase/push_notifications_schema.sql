-- ═══════════════════════════════════════════════════════════════════════════
-- LEMON — Push Notifications Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. PUSH SUBSCRIPTIONS ──────────────────────────────────────────────────
-- Stores each browser/device subscription for a user.
-- A user can have multiple subscriptions (multiple devices).
create table if not exists public.push_subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subscriptions(user_id);

-- ─── 2. SCHEDULED NOTIFICATIONS ─────────────────────────────────────────────
-- Admin-created notifications that get sent at a scheduled time.
-- target_type: 'all' = all users, 'user' = specific user_id
create table if not exists public.scheduled_notifications (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  body         text not null,
  icon         text not null default '/icon-192.png',
  url          text not null default '/',
  target_type  text not null default 'all' check (target_type in ('all', 'user')),
  target_user  uuid references public.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  sent_at      timestamptz,
  sent_count   int not null default 0,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists sched_notif_sent_at_idx on public.scheduled_notifications(sent_at, scheduled_at);

-- ─── 3. NOTIFICATION LOG ────────────────────────────────────────────────────
-- Optional audit trail of every push sent.
create table if not exists public.notification_logs (
  id              uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.push_subscriptions(id) on delete set null,
  user_id         uuid references public.users(id) on delete set null,
  title           text not null,
  body            text not null,
  type            text not null default 'manual', -- 'manual' | 'reminder_meal' | 'reminder_workout' | 'reminder_water' | 'motivation'
  sent_at         timestamptz not null default now(),
  error           text
);
create index if not exists notif_log_user_idx on public.notification_logs(user_id, sent_at);

-- ─── RLS (open policies — same pattern as rest of app) ───────────────────────
alter table public.push_subscriptions        enable row level security;
alter table public.scheduled_notifications   enable row level security;
alter table public.notification_logs         enable row level security;

create policy "open_push_subs"   on public.push_subscriptions      for all using (true) with check (true);
create policy "open_sched_notif" on public.scheduled_notifications  for all using (true) with check (true);
create policy "open_notif_log"   on public.notification_logs        for all using (true) with check (true);
