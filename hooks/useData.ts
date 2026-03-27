'use client'
import { useState, useEffect, useCallback } from 'react'
import * as db from '@/lib/db'
import type {
  MealLog, WorkoutLog, WeightLog, DailyLog, MacroSummary,
  MealTemplate, WorkoutTemplate,
  UserSettings, SmokingSettings, SmokingLog,
  ExerciseSet, BodyMeasurement,
} from '@/types'

function today() { return new Date().toISOString().split('T')[0] }

function useAsync<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[] = []) {
  const [data, setData]       = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await fetcher()) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])
  return { data, loading, error, refetch: load, setData }
}

// ─── USER SETTINGS ─────────────────────────────────────────────────────────

export function useUserSettings() {
  const { data, loading, error, refetch, setData } = useAsync<UserSettings | null>(
    () => db.getUserSettings(), null
  )

  const save = useCallback(async (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const saved = await db.upsertUserSettings(updates)
    setData(saved)
    return saved
  }, [setData])

  return { settings: data, loading, error, refetch, save }
}

// ─── TEMPLATES ─────────────────────────────────────────────────────────────

export function useMealTemplates() {
  return useAsync<MealTemplate[]>(() => db.getMealTemplates(), [])
}

export function useWorkoutTemplates() {
  return useAsync<WorkoutTemplate[]>(() => db.getWorkoutTemplates(), [])
}

// ─── MEALS ─────────────────────────────────────────────────────────────────

export function useMeals(date: string = today()) {
  const { data: meals, loading, error, refetch, setData } = useAsync<MealLog[]>(
    () => db.getMealsForDate(date), [], [date]
  )

  const addMeal = useCallback(async (meal: Parameters<typeof db.addMeal>[0]) => {
    const temp = { ...meal, id: `temp-${Date.now()}`, created_at: '', date, logged_at: new Date().toISOString(), user_id: '' } as MealLog
    setData(prev => [...prev, temp])
    try {
      const saved = await db.addMeal(meal)
      setData(prev => prev.map(m => m.id === temp.id ? saved : m))
    } catch (e) {
      setData(prev => prev.filter(m => m.id !== temp.id))
      throw e
    }
  }, [date, setData])

  const deleteMeal = useCallback(async (id: string) => {
    setData(prev => prev.filter(m => m.id !== id))
    try { await db.deleteMeal(id) }
    catch (e) { await refetch(); throw e }
  }, [refetch, setData])

  const totals: MacroSummary = meals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return { meals, totals, loading, error, refetch, addMeal, deleteMeal }
}

export function useWeeklyMeals() {
  return useAsync<MealLog[]>(() => db.getMealsForWeek(), [])
}

// ─── WORKOUTS ──────────────────────────────────────────────────────────────

export function useWorkouts(date: string = today()) {
  const { data: workouts, loading, error, refetch, setData } = useAsync<WorkoutLog[]>(
    () => db.getWorkoutsForDate(date), [], [date]
  )

  const addWorkout = useCallback(async (w: Parameters<typeof db.addWorkout>[0]) => {
    const saved = await db.addWorkout(w)
    setData(prev => [...prev, saved])
    return saved
  }, [setData])

  const toggleComplete = useCallback(async (id: string, completed: boolean) => {
    setData(prev => prev.map(w => w.id === id ? { ...w, completed } : w))
    try { await db.updateWorkoutCompleted(id, completed) }
    catch (e) { await refetch(); throw e }
  }, [refetch, setData])

  const deleteWorkout = useCallback(async (id: string) => {
    setData(prev => prev.filter(w => w.id !== id))
    try { await db.deleteWorkout(id) }
    catch (e) { await refetch(); throw e }
  }, [refetch, setData])

  return { workouts, loading, error, refetch, addWorkout, toggleComplete, deleteWorkout }
}

export function useWeeklyWorkouts() {
  return useAsync<WorkoutLog[]>(() => db.getWorkoutsForWeek(), [])
}

// ─── EXERCISE SETS (progressive overload) ──────────────────────────────────

export function useExerciseHistory(exerciseName: string, days = 90) {
  return useAsync<ExerciseSet[]>(
    () => db.getExerciseHistory(exerciseName, days), [], [exerciseName, days]
  )
}

export function useExerciseNames() {
  return useAsync<string[]>(() => db.getExerciseNames(), [])
}

// ─── WEIGHT ────────────────────────────────────────────────────────────────

export function useWeight(days = 60) {
  const { data: logs, loading, error, refetch, setData } = useAsync<WeightLog[]>(
    () => db.getWeightLogs(days), [], [days]
  )

  const addWeight = useCallback(async (weight_kg: number, note?: string) => {
    const saved = await db.addWeightLog(weight_kg, note)
    setData(prev => [...prev, saved].sort((a, b) => a.date.localeCompare(b.date)))
    return saved
  }, [setData])

  const deleteWeight = useCallback(async (id: string) => {
    setData(prev => prev.filter(w => w.id !== id))
    try { await db.deleteWeightLog(id) }
    catch (e) { await refetch(); throw e }
  }, [refetch, setData])

  const latest  = logs.length ? logs[logs.length - 1] : null
  const first   = logs.length ? logs[0] : null
  const change  = latest && first ? +(latest.weight_kg - first.weight_kg).toFixed(1) : 0

  return { logs, latest, change, loading, error, refetch, addWeight, deleteWeight }
}

// ─── DAILY LOG ─────────────────────────────────────────────────────────────

export function useDailyLog(date = today()) {
  const { data: log, loading, error, refetch, setData } = useAsync<DailyLog | null>(
    () => db.getDailyLog(date), null, [date]
  )

  const update = useCallback(async (updates: Partial<Pick<DailyLog, 'water_glasses' | 'sleep_hours' | 'steps' | 'mood'>>) => {
    setData(prev => prev ? { ...prev, ...updates } : null)
    try { const saved = await db.upsertDailyLog(updates, date); setData(saved) }
    catch (e) { await refetch(); throw e }
  }, [date, refetch, setData])

  return {
    log, loading, error, refetch,
    water: log?.water_glasses ?? 0,
    sleep: log?.sleep_hours   ?? 0,
    steps: log?.steps         ?? 0,
    mood:  log?.mood          ?? 0,
    setWater: (n: number) => update({ water_glasses: n }),
    setSleep: (n: number) => update({ sleep_hours: n }),
    setSteps: (n: number) => update({ steps: n }),
    setMood:  (n: number) => update({ mood: n }),
  }
}

export function useWeeklyDailyLogs() {
  return useAsync<DailyLog[]>(() => db.getDailyLogsForWeek(), [])
}

// ─── SMOKING ───────────────────────────────────────────────────────────────

export function useSmokingSettings() {
  const { data, loading, error, refetch, setData } = useAsync<SmokingSettings | null>(
    () => db.getSmokingSettings(), null
  )

  const save = useCallback(async (updates: Partial<Omit<SmokingSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const saved = await db.upsertSmokingSettings(updates)
    setData(saved)
    return saved
  }, [setData])

  return { settings: data, loading, error, refetch, save }
}

export function useSmokingToday() {
  const { data: logs, loading, error, refetch, setData } = useAsync<SmokingLog[]>(
    () => db.getSmokingLogsForDate(), []
  )

  const logSmoked = useCallback(async (note?: string) => {
    const saved = await db.addSmokingLog({ type: 'smoked', note: note ?? null })
    setData(prev => [...prev, saved])
    return saved
  }, [setData])

  const logCravingResisted = useCallback(async (note?: string) => {
    const saved = await db.addSmokingLog({ type: 'craving_resisted', note: note ?? null })
    setData(prev => [...prev, saved])
    return saved
  }, [setData])

  const deleteLog = useCallback(async (id: string) => {
    setData(prev => prev.filter(l => l.id !== id))
    try { await db.deleteSmokingLog(id) }
    catch (e) { await refetch(); throw e }
  }, [refetch, setData])

  const smokedToday    = logs.filter(l => l.type === 'smoked').length
  const resistedToday  = logs.filter(l => l.type === 'craving_resisted').length

  return { logs, smokedToday, resistedToday, loading, error, refetch, logSmoked, logCravingResisted, deleteLog }
}

export function useSmokingHistory(days = 30) {
  return useAsync<SmokingLog[]>(() => db.getSmokingLogsForDays(days), [], [days])
}

// ─── BODY MEASUREMENTS ─────────────────────────────────────────────────────

export function useBodyMeasurements(days = 90) {
  const { data: logs, loading, error, refetch, setData } = useAsync<BodyMeasurement[]>(
    () => db.getBodyMeasurements(days), [], [days]
  )

  const save = useCallback(async (updates: Parameters<typeof db.upsertBodyMeasurement>[0]) => {
    const saved = await db.upsertBodyMeasurement(updates)
    setData(prev => {
      const filtered = prev.filter(m => m.date !== saved.date)
      return [...filtered, saved].sort((a, b) => a.date.localeCompare(b.date))
    })
    return saved
  }, [setData])

  return { logs, loading, error, refetch, save }
}
