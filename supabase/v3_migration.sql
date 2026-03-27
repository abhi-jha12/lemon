-- ═══════════════════════════════════════════════════════════════════════════
-- LEMON v3 — Migration (run this if you already have the v1/v2 schema)
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- If setting up fresh, just run schema.sql — it includes these tables.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. USER SETTINGS ────────────────────────────────────────────────────────
create table if not exists public.user_settings (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid not null unique references public.users(id) on delete cascade,
  calorie_goal                 int  not null default 2200,
  protein_goal                 int  not null default 120,
  carbs_goal                   int  not null default 220,
  fat_goal                     int  not null default 65,
  weight_goal_kg               numeric(5,2),
  weekly_workout_target        int  not null default 4,
  goal_type                    text not null default 'maintain' check (goal_type in ('cut','maintain','gain')),
  age                          int,
  height_cm                    numeric(5,1),
  sex                          text check (sex in ('male','female','other')),
  activity_level               text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  smoking_quit_date            date,
  cigarettes_per_day_baseline  int  not null default 10,
  pack_price_inr               numeric(8,2) not null default 250,
  cigarettes_per_pack          int  not null default 20,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "open_user_settings" on public.user_settings;
create policy "open_user_settings" on public.user_settings for all using (true) with check (true);

-- ─── 2. SMOKING LOGS ──────────────────────────────────────────────────────────
create table if not exists public.smoking_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  logged_at  timestamptz not null default now(),
  date       date not null default current_date,
  type       text not null check (type in ('smoked','craving_resisted')),
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists smoking_logs_user_date_idx on public.smoking_logs(user_id, date);
alter table public.smoking_logs enable row level security;
drop policy if exists "open_smoking_logs" on public.smoking_logs;
create policy "open_smoking_logs" on public.smoking_logs for all using (true) with check (true);

-- ─── 3. BODY MEASUREMENTS ────────────────────────────────────────────────────
create table if not exists public.body_measurements (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  date       date not null default current_date,
  chest_cm   numeric(5,1),
  waist_cm   numeric(5,1),
  hips_cm    numeric(5,1),
  arms_cm    numeric(5,1),
  thighs_cm  numeric(5,1),
  note       text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
create index if not exists body_measurements_user_idx on public.body_measurements(user_id, date);
alter table public.body_measurements enable row level security;
drop policy if exists "open_body_measurements" on public.body_measurements;
create policy "open_body_measurements" on public.body_measurements for all using (true) with check (true);
