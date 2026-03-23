/**
 * Lemon — Data Access Layer (v2 — with user auth + templates)
 */

import { supabase } from './supabase-browser'
import type {
  MealLog, MealLogInsert,
  WorkoutLog, WorkoutLogInsert,
  WeightLog, WeightLogInsert,
  DailyLog, DailyLogInsert,
  MealTemplate, WorkoutTemplate,
  MacroSummary,
} from '@/types'

function today() {
  return new Date().toISOString().split('T')[0]
}

function err<T>(data: T | null, error: unknown): T {
  if (error) throw error
  return data as T
}

// ─── SESSION USER ID ───────────────────────────────────────────────────────
// We store our own session cookie, so we read it client-side from the API.
let _cachedUserId: string | null = null

export async function getCurrentUserId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId
  try {
    const res = await fetch('/api/auth/me')
    const { user } = await res.json()
    _cachedUserId = user?.id ?? null
    return _cachedUserId!
  } catch {
    return 'anonymous'
  }
}

export function clearUserIdCache() {
  _cachedUserId = null
}

// ─── TEMPLATES ─────────────────────────────────────────────────────────────

export async function getMealTemplates(): Promise<MealTemplate[]> {
  const { data, error } = await supabase()
    .from('meal_templates')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name')
  return err(data, error) ?? []
}

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase()
    .from('workout_templates')
    .select('*, exercises:workout_template_exercises(*)')
    .eq('is_active', true)
    .order('name')
  return err(data, error) ?? []
}

// ─── MEAL LOGS ─────────────────────────────────────────────────────────────

export async function getMealsForDate(date: string = today()): Promise<MealLog[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase()
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('logged_at', { ascending: true })
  return err(data, error) ?? []
}

export async function getMealsForWeek(): Promise<MealLog[]> {
  const userId = await getCurrentUserId()
  const end   = today()
  const start = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
  const { data, error } = await supabase()
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
  return err(data, error) ?? []
}

export async function addMeal(
  meal: Omit<MealLogInsert, 'user_id' | 'date' | 'logged_at'> & { date?: string }
): Promise<MealLog> {
  const userId = await getCurrentUserId()
  const row: MealLogInsert = {
    ...meal,
    date:      meal.date ?? today(),
    logged_at: new Date().toISOString(),
    user_id:   userId,
  }
  const { data, error } = await supabase()
    .from('meal_logs')
    .insert(row)
    .select()
    .single()
  return err(data, error)
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase().from('meal_logs').delete().eq('id', id)
  if (error) throw error
}

// ─── WORKOUT LOGS ──────────────────────────────────────────────────────────

export async function getWorkoutsForDate(date: string = today()): Promise<WorkoutLog[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase()
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true })
  return err(data, error) ?? []
}

export async function getWorkoutsForWeek(): Promise<WorkoutLog[]> {
  const userId = await getCurrentUserId()
  const end   = today()
  const start = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
  const { data, error } = await supabase()
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
  return err(data, error) ?? []
}

export async function addWorkout(
  workout: Omit<WorkoutLogInsert, 'user_id' | 'date'> & { date?: string }
): Promise<WorkoutLog> {
  const userId = await getCurrentUserId()
  const row: WorkoutLogInsert = {
    ...workout,
    date:    workout.date ?? today(),
    user_id: userId,
  }
  const { data, error } = await supabase()
    .from('workout_logs')
    .insert(row)
    .select()
    .single()
  return err(data, error)
}

export async function updateWorkoutCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase()
    .from('workout_logs')
    .update({ completed })
    .eq('id', id)
  if (error) throw error
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase().from('workout_logs').delete().eq('id', id)
  if (error) throw error
}

// ─── WEIGHT LOGS ───────────────────────────────────────────────────────────

export async function getWeightLogs(days = 60): Promise<WeightLog[]> {
  const userId = await getCurrentUserId()
  const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  const { data, error } = await supabase()
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .order('date', { ascending: true })
  return err(data, error) ?? []
}

export async function addWeightLog(weight_kg: number, note?: string): Promise<WeightLog> {
  const userId = await getCurrentUserId()
  const row: WeightLogInsert = {
    weight_kg, note: note ?? null, date: today(), user_id: userId,
  }
  const { data, error } = await supabase()
    .from('weight_logs')
    .insert(row)
    .select()
    .single()
  return err(data, error)
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await supabase().from('weight_logs').delete().eq('id', id)
  if (error) throw error
}

// ─── DAILY LOGS ────────────────────────────────────────────────────────────

export async function getDailyLog(date = today()): Promise<DailyLog | null> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase()
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertDailyLog(
  updates: Partial<Omit<DailyLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
  date = today()
): Promise<DailyLog> {
  const userId  = await getCurrentUserId()
  const existing = await getDailyLog(date)

  if (existing) {
    const { data, error } = await supabase()
      .from('daily_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    return err(data, error)
  }

  const row: DailyLogInsert = {
    date, water_glasses: 0, sleep_hours: 0, steps: null, mood: null,
    user_id: userId, ...updates,
  }
  const { data, error } = await supabase()
    .from('daily_logs')
    .insert(row)
    .select()
    .single()
  return err(data, error)
}

export async function getDailyLogsForWeek(): Promise<DailyLog[]> {
  const userId = await getCurrentUserId()
  const end   = today()
  const start = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
  const { data, error } = await supabase()
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
  return err(data, error) ?? []
}

// ─── Derived ───────────────────────────────────────────────────────────────

export async function getMacroSummaryForDate(date = today()): Promise<MacroSummary> {
  const meals = await getMealsForDate(date)
  return meals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
