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

// ─── Derived ───────────────────────────────────────────────────────────────

export interface MacroSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}
