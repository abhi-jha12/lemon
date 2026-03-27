// ─── User & Auth ───────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

// ─── User Settings ─────────────────────────────────────────────────────────

export interface UserSettings {
  id: string
  user_id: string
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
  weekly_workout_target: number
  weight_goal_kg: number | null
  age: number | null
  height_cm: number | null
  smoking_quit_date: string | null
  cigarettes_per_day_baseline: number | null
  pack_price_inr: number | null
  cigarettes_per_pack: number | null
  sex: 'male' | 'female' | 'other' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  goal_type: 'cut' | 'maintain' | 'gain'
  created_at: string
  updated_at: string
}

// ─── Smoking ───────────────────────────────────────────────────────────────

export interface SmokingLog {
  id: string
  user_id: string
  logged_at: string
  date: string
  type: 'smoked' | 'craving_resisted'
  note: string | null
  created_at: string
}

export type SmokingLogInsert = Omit<SmokingLog, 'id' | 'created_at'>

// ─── Templates (admin-managed) ─────────────────────────────────────────────

export interface MealTemplate {
  id: string
  name: string
  emoji: string
  calories: number
  protein: number
  carbs: number
  fat: number
  category: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' | 'General'
  is_active: boolean
  created_by: string | null
  created_at: string
}

export type MealTemplateInsert = Omit<MealTemplate, 'id' | 'created_at'>

export interface WorkoutTemplate {
  id: string
  name: string
  tag: string
  emoji: string
  duration_minutes: number
  calories_burned: number
  is_active: boolean
  created_by: string | null
  created_at: string
  exercises?: WorkoutTemplateExercise[]
}

export type WorkoutTemplateInsert = Omit<WorkoutTemplate, 'id' | 'created_at' | 'exercises'>

export interface WorkoutTemplateExercise {
  id: string
  workout_template_id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility'
  sets: number | null
  reps: string | null
  duration_seconds: number | null
  rest_seconds: number | null
  sort_order: number
}

export type WorkoutTemplateExerciseInsert = Omit<WorkoutTemplateExercise, 'id'>

// ─── Logs ──────────────────────────────────────────────────────────────────

export interface MealLog {
  id: string
  user_id: string
  meal_slot: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'
  name: string
  emoji: string
  calories: number
  protein: number
  carbs: number
  fat: number
  logged_at: string
  date: string
  created_at: string
}

export type MealLogInsert = Omit<MealLog, 'id' | 'created_at'>

export interface WorkoutLog {
  id: string
  user_id: string
  name: string
  tag: string
  duration_minutes: number
  calories_burned: number
  date: string
  completed: boolean
  created_at: string
}

export type WorkoutLogInsert = Omit<WorkoutLog, 'id' | 'created_at'>

export interface ExerciseLog {
  id: string
  user_id: string
  workout_log_id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility'
  sets: number | null
  reps: string | null
  duration_seconds: number | null
  rest_seconds: number | null
  done: boolean
  sort_order: number
  created_at: string
}

export type ExerciseLogInsert = Omit<ExerciseLog, 'id' | 'created_at'>

export interface ExerciseSet {
  id: string
  user_id: string
  exercise_log_id: string | null
  exercise_name: string
  set_number: number
  weight_kg: number | null
  reps_completed: number | null
  duration_seconds: number | null
  date: string
  created_at: string
}

export type ExerciseSetInsert = Omit<ExerciseSet, 'id' | 'created_at'>

export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number
  date: string
  note: string | null
  created_at: string
}

export type WeightLogInsert = Omit<WeightLog, 'id' | 'created_at'>

export interface DailyLog {
  id: string
  user_id: string
  date: string
  water_glasses: number
  sleep_hours: number
  steps: number | null
  mood: number | null
  created_at: string
  updated_at: string
}

export type DailyLogInsert = Omit<DailyLog, 'id' | 'created_at' | 'updated_at'>

export interface BodyMeasurement {
  id: string
  user_id: string
  date: string
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  arms_cm: number | null
  thighs_cm: number | null
  note: string | null
  created_at: string
}

export type BodyMeasurementInsert = Omit<BodyMeasurement, 'id' | 'created_at'>

// ─── Derived ───────────────────────────────────────────────────────────────

export interface MacroSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// ─── BMR Helpers ───────────────────────────────────────────────────────────

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
}

export const GOAL_ADJUSTMENTS: Record<string, number> = {
  cut:      -400,
  maintain: 0,
  gain:     300,
}

export function calculateBMR(settings: UserSettings, weightKg: number): number | null {
  if (!settings.age || !settings.height_cm || !settings.sex) return null
  const s = settings.sex === 'male' ? 5 : settings.sex === 'female' ? -161 : -78
  return Math.round(10 * weightKg + 6.25 * settings.height_cm - 5 * settings.age + s)
}

export function calculateTDEE(settings: UserSettings, weightKg: number): number | null {
  const bmr = calculateBMR(settings, weightKg)
  if (!bmr || !settings.activity_level) return null
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[settings.activity_level])
  return tdee + (GOAL_ADJUSTMENTS[settings.goal_type] ?? 0)
}
