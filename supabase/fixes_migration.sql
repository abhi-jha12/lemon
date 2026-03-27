-- ═══════════════════════════════════════════════════════════════════════════
-- LEMON — Bug-fix Migration
-- Run this if you already have the v3 schema applied.
-- Safe to run multiple times (all statements are idempotent).
-- Supabase Dashboard → SQL Editor → New Query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. user_settings: add goal_type column ──────────────────────────────────
-- The TypeScript type requires this column but it was missing from the schema.
alter table public.user_settings
  add column if not exists goal_type text not null default 'maintain'
    check (goal_type in ('cut', 'maintain', 'gain'));

-- ─── 2. body_measurements: add thighs_cm column ──────────────────────────────
-- TypeScript BodyMeasurement type and MacroTracker UI both reference thighs_cm
-- but the column was absent from the table.
alter table public.body_measurements
  add column if not exists thighs_cm numeric(5,1);

-- ─── 3. Verify there is NO weekly_workout_goal or water_goal column ───────────
-- These were incorrect column names used in the TypeScript code.
-- The correct DB column is weekly_workout_target (already exists).
-- No SQL action needed — the fix was on the TypeScript side.

-- ─── 4. Drop the orphaned smoking_settings table if it exists ────────────────
-- SmokingTracker previously wrote to a smoking_settings table that was never
-- in the schema. All smoking config now lives in user_settings.
-- This is safe to drop — it was never populated via the real app.
drop table if exists public.smoking_settings;

-- ─── Done ────────────────────────────────────────────────────────────────────
-- After running this, your DB will be fully aligned with the fixed codebase.
