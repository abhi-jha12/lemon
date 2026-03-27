-- ═══════════════════════════════════════════════════════════════════════════
-- LEMON — Full Supabase Schema (v2 — with Auth + Admin)
-- Run entirely in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── 1. USERS ───────────────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);
create index if not exists users_email_idx on public.users(email);

-- ─── 2. MEAL TEMPLATES (admin-managed catalogue) ────────────────────────────
create table if not exists public.meal_templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  emoji       text not null default '🍽️',
  calories    int  not null default 0,
  protein     int  not null default 0,
  carbs       int  not null default 0,
  fat         int  not null default 0,
  category    text not null default 'General'
               check (category in ('Breakfast','Lunch','Snack','Dinner','General')),
  is_active   boolean not null default true,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ─── 3. WORKOUT TEMPLATES (admin-managed) ───────────────────────────────────
create table if not exists public.workout_templates (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  tag              text not null default '',
  emoji            text not null default '💪',
  duration_minutes int  not null default 30,
  calories_burned  int  not null default 200,
  is_active        boolean not null default true,
  created_by       uuid references public.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- ─── 4. WORKOUT TEMPLATE EXERCISES ──────────────────────────────────────────
create table if not exists public.workout_template_exercises (
  id                  uuid primary key default uuid_generate_v4(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  name                text not null,
  type                text not null check (type in ('strength','cardio','flexibility')),
  sets                int,
  reps                text,
  duration_seconds    int,
  rest_seconds        int,
  sort_order          int  not null default 0
);
create index if not exists wte_template_idx on public.workout_template_exercises(workout_template_id);

-- ─── 5. MEAL LOGS ───────────────────────────────────────────────────────────
create table if not exists public.meal_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  meal_slot    text not null check (meal_slot in ('Breakfast','Lunch','Snack','Dinner')),
  name         text not null,
  emoji        text not null default '🍽️',
  calories     int  not null default 0,
  protein      int  not null default 0,
  carbs        int  not null default 0,
  fat          int  not null default 0,
  logged_at    timestamptz not null default now(),
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);
create index if not exists meal_logs_user_date_idx on public.meal_logs(user_id, date);

-- ─── 6. WORKOUT LOGS ────────────────────────────────────────────────────────
create table if not exists public.workout_logs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  name             text not null,
  tag              text not null default '',
  duration_minutes int  not null default 0,
  calories_burned  int  not null default 0,
  date             date not null default current_date,
  completed        boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists workout_logs_user_date_idx on public.workout_logs(user_id, date);

-- ─── 7. EXERCISE LOGS ───────────────────────────────────────────────────────
create table if not exists public.exercise_logs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  workout_log_id   uuid not null references public.workout_logs(id) on delete cascade,
  name             text not null,
  type             text not null check (type in ('strength','cardio','flexibility')),
  sets             int,
  reps             text,
  duration_seconds int,
  rest_seconds     int,
  done             boolean not null default false,
  sort_order       int  not null default 0,
  created_at       timestamptz not null default now()
);

-- ─── 8. WEIGHT LOGS ─────────────────────────────────────────────────────────
create table if not exists public.weight_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  weight_kg  numeric(5,2) not null,
  date       date not null default current_date,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists weight_logs_user_idx on public.weight_logs(user_id, date);

-- ─── 9. DAILY LOGS ──────────────────────────────────────────────────────────
create table if not exists public.daily_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  date          date not null default current_date,
  water_glasses int  not null default 0,
  sleep_hours   numeric(4,1) not null default 0,
  steps         int,
  mood          int check (mood between 1 and 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, date)
);

-- ─── RLS: open policies (no Supabase Auth — we handle sessions ourselves) ───
alter table public.users                    enable row level security;
alter table public.meal_templates           enable row level security;
alter table public.workout_templates        enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.meal_logs                enable row level security;
alter table public.workout_logs             enable row level security;
alter table public.exercise_logs            enable row level security;
alter table public.weight_logs              enable row level security;
alter table public.daily_logs               enable row level security;

create policy "open_users"     on public.users                      for all using (true) with check (true);
create policy "open_meal_tpl"  on public.meal_templates             for all using (true) with check (true);
create policy "open_wkt_tpl"   on public.workout_templates          for all using (true) with check (true);
create policy "open_wkt_ex"    on public.workout_template_exercises for all using (true) with check (true);
create policy "open_meal_logs" on public.meal_logs                  for all using (true) with check (true);
create policy "open_wkt_logs"  on public.workout_logs               for all using (true) with check (true);
create policy "open_ex_logs"   on public.exercise_logs              for all using (true) with check (true);
create policy "open_wgt_logs"  on public.weight_logs                for all using (true) with check (true);
create policy "open_day_logs"  on public.daily_logs                 for all using (true) with check (true);

-- ─── SEED: default admin user (password: admin123) ──────────────────────────
-- bcrypt hash of "admin123" with salt rounds=10
insert into public.users (name, email, password_hash, role) values
  ('Admin', 'admin@lemon.app', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
on conflict (email) do nothing;

-- ─── SEED: default meal templates ───────────────────────────────────────────
insert into public.meal_templates (name, emoji, calories, protein, carbs, fat, category) values
  ('Oats with Banana & Honey',   '🥣', 380, 12, 68,  6,  'Breakfast'),
  ('Scrambled Eggs on Toast',    '🍳', 320, 24, 28,  12, 'Breakfast'),
  ('Greek Yogurt Parfait',       '🫙', 280, 20, 32,  7,  'Breakfast'),
  ('Grilled Chicken Rice Bowl',  '🍚', 540, 42, 55,  12, 'Lunch'),
  ('Dal Tadka + Roti',           '🍛', 420, 18, 65,  9,  'Lunch'),
  ('Paneer Bhurji + Toast',      '🍞', 360, 22, 28,  16, 'Lunch'),
  ('Rajma Chawal',               '🫘', 480, 20, 78,  8,  'Dinner'),
  ('Palak Paneer + Rice',        '🥘', 460, 19, 58,  14, 'Dinner'),
  ('Grilled Fish + Veggies',     '🐟', 380, 36, 22,  10, 'Dinner'),
  ('Mixed Nuts & Fruit',         '🥜', 210, 6,  22,  12, 'Snack'),
  ('Smoothie Bowl',              '🥤', 320, 14, 48,  8,  'Snack'),
  ('Protein Bar',                '🍫', 220, 20, 24,  7,  'Snack')
on conflict do nothing;

-- ─── SEED: default workout templates ────────────────────────────────────────
insert into public.workout_templates (name, tag, emoji, duration_minutes, calories_burned) values
  ('Full Body Endurance', 'Cardio + Strength', '⚡', 45, 320),
  ('Morning Run',         'Cardio',            '🏃', 30, 240),
  ('Upper Body Strength', 'Strength',          '💪', 40, 280),
  ('HIIT Circuit',        'HIIT',              '🔥', 25, 300),
  ('Yoga & Flexibility',  'Flexibility',       '🧘', 35, 150)
on conflict do nothing;

-- Exercises for "Full Body Endurance"
with t as (select id from public.workout_templates where name='Full Body Endurance' limit 1)
insert into public.workout_template_exercises (workout_template_id,name,type,sets,reps,duration_seconds,rest_seconds,sort_order) values
  ((select id from t),'Warm-up Jog','cardio',null,null,300,0,1),
  ((select id from t),'Jump Rope','cardio',null,null,180,60,2),
  ((select id from t),'Bodyweight Squats','strength',3,'15',null,45,3),
  ((select id from t),'Push-ups','strength',3,'12',null,45,4),
  ((select id from t),'Plank Hold','strength',null,null,45,30,5),
  ((select id from t),'Mountain Climbers','cardio',null,null,60,30,6),
  ((select id from t),'Lunges','strength',3,'12 each',null,45,7),
  ((select id from t),'Cool Down Stretch','flexibility',null,null,300,0,8);

-- Exercises for "Morning Run"
with t as (select id from public.workout_templates where name='Morning Run' limit 1)
insert into public.workout_template_exercises (workout_template_id,name,type,sets,reps,duration_seconds,rest_seconds,sort_order) values
  ((select id from t),'Easy Jog Warm-up','cardio',null,null,300,0,1),
  ((select id from t),'Steady State Run','cardio',null,null,1200,0,2),
  ((select id from t),'Sprint Intervals','cardio',4,'30s sprint/30s walk',null,0,3),
  ((select id from t),'Cool Down Walk','cardio',null,null,300,0,4);

-- Exercises for "Upper Body Strength"
with t as (select id from public.workout_templates where name='Upper Body Strength' limit 1)
insert into public.workout_template_exercises (workout_template_id,name,type,sets,reps,duration_seconds,rest_seconds,sort_order) values
  ((select id from t),'Push-ups','strength',4,'15',null,60,1),
  ((select id from t),'Diamond Push-ups','strength',3,'10',null,60,2),
  ((select id from t),'Dumbbell Rows','strength',3,'12 each',null,60,3),
  ((select id from t),'Shoulder Press','strength',3,'12',null,60,4),
  ((select id from t),'Bicep Curls','strength',3,'15',null,45,5),
  ((select id from t),'Tricep Dips','strength',3,'12',null,45,6);

-- ═══════════════════════════════════════════════════════════════════════════
-- LEMON v3 — New tables: smoking tracker + user settings
-- Run this in Supabase Dashboard → SQL Editor after the original schema
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── USER SETTINGS (goals, profile, smoking config) ─────────────────────────
create table if not exists public.user_settings (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null unique references public.users(id) on delete cascade,
  -- fitness goals
  calorie_goal             int  not null default 2200,
  protein_goal             int  not null default 120,
  carbs_goal               int  not null default 220,
  fat_goal                 int  not null default 65,
  weight_goal_kg           numeric(5,2),
  weekly_workout_target    int  not null default 4,
  goal_type                text not null default 'maintain' check (goal_type in ('cut','maintain','gain')),
  -- body profile (for BMR)
  age                      int,
  height_cm                numeric(5,1),
  sex                      text check (sex in ('male','female','other')),
  activity_level           text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  -- smoking settings
  smoking_quit_date        date,
  cigarettes_per_day_baseline int not null default 10,
  pack_price_inr           numeric(8,2) not null default 250,
  cigarettes_per_pack      int  not null default 20,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
alter table public.user_settings enable row level security;
create policy "open_user_settings" on public.user_settings for all using (true) with check (true);

-- ─── SMOKING LOGS ────────────────────────────────────────────────────────────
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
create policy "open_smoking_logs" on public.smoking_logs for all using (true) with check (true);

-- ─── BODY MEASUREMENTS ───────────────────────────────────────────────────────
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
create policy "open_body_measurements" on public.body_measurements for all using (true) with check (true);
