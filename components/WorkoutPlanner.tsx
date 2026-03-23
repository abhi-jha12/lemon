'use client'
import { useState } from 'react'
import { Play, Check, Timer, Flame, Dumbbell, Wind, Heart, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useWorkouts, useWorkoutTemplates, useWeeklyWorkouts } from '@/hooks/useData'
import type { WorkoutLog, WorkoutTemplate } from '@/types'

const TYPE_ICON  = { strength: Dumbbell, cardio: Wind, flexibility: Heart } as const
const TYPE_COLOR = { strength: 'text-lemon-400', cardio: 'text-forest-400', flexibility: 'text-purple-400' } as const

function fmtTime(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

export default function WorkoutPlanner() {
  const { workouts, loading, error, addWorkout, toggleComplete, deleteWorkout } = useWorkouts()
  const { data: templates, loading: tplLoading } = useWorkoutTemplates()
  const { data: weekWorkouts } = useWeeklyWorkouts()

  const [timerSecs, setTimerSecs]   = useState(0)
  const [timerOn, setTimerOn]       = useState(false)
  const [timerRef, setTimerRef]     = useState<ReturnType<typeof setInterval> | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const toggleTimer = () => {
    if (timerOn) {
      if (timerRef) clearInterval(timerRef)
      setTimerRef(null); setTimerOn(false)
    } else {
      const ref = setInterval(() => setTimerSecs(s => s + 1), 1000)
      setTimerRef(ref); setTimerOn(true)
    }
  }

  const handleAddFromTemplate = async (tpl: WorkoutTemplate) => {
    setSaving(true)
    try {
      await addWorkout({ name: tpl.name, tag: tpl.tag, duration_minutes: tpl.duration_minutes, calories_burned: tpl.calories_burned, completed: false })
      showToast(`Added "${tpl.name}"`)
      setShowTemplates(false)
    } catch { showToast('Failed to save — check Supabase config') }
    finally { setSaving(false) }
  }

  const handleToggleComplete = async (w: WorkoutLog) => {
    try { await toggleComplete(w.id, !w.completed) }
    catch { showToast('Could not update workout') }
  }

  const handleDelete = async (id: string) => {
    try { await deleteWorkout(id) }
    catch { showToast('Could not delete workout') }
  }

  // Weekly stats
  const completedThisWeek   = (weekWorkouts ?? []).filter(w => w.completed)
  const totalMinsThisWeek   = completedThisWeek.reduce((s, w) => s + w.duration_minutes, 0)
  const totalCalsBurnedWeek = completedThisWeek.reduce((s, w) => s + w.calories_burned, 0)

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Timer */}
      <div className="card p-4 flex items-center justify-between lemon-glow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lemon-500/15 flex items-center justify-center">
            <Timer size={18} className="text-lemon-400" />
          </div>
          <div>
            <p className="text-xs text-lemon-100/50">Workout Timer</p>
            <p className="font-display text-xl font-bold text-lemon-300 tabular-nums">{fmtTime(timerSecs)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleTimer}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              timerOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-lemon-500/20 text-lemon-300 border border-lemon-500/30'}`}>
            <Play size={14} className={timerOn ? 'fill-red-400' : 'fill-lemon-300'} />
            {timerOn ? 'Pause' : 'Start'}
          </button>
          {timerSecs > 0 && !timerOn && (
            <button onClick={() => setTimerSecs(0)} className="px-3 py-2 rounded-xl text-xs text-lemon-100/40 border border-lemon-500/20">Reset</button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
          ⚠️ {error.includes('Missing Supabase') ? 'Add your Supabase keys to .env.local' : error}
        </div>
      )}
      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={16} /><span>{toast}</span>
        </div>
      )}

      {/* Today's workouts */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-3">
          <p className="text-sm font-semibold text-lemon-200">Today&apos;s Workouts</p>
          <button onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 text-xs text-lemon-400 bg-lemon-500/15 px-3 py-1.5 rounded-lg border border-lemon-500/25 hover:bg-lemon-500/25 transition-all">
            <Plus size={12} /> Add
          </button>
        </div>

        {/* Template picker from DB */}
        {showTemplates && (
          <div className="px-4 pb-4 space-y-2 animate-fade-in border-t border-lemon-500/10 pt-3">
            <p className="text-xs text-lemon-100/40 mb-2">Choose a workout template:</p>
            {tplLoading && <div className="flex justify-center py-3"><Loader2 size={16} className="text-lemon-400/50 animate-spin" /></div>}
            {!tplLoading && (!templates || templates.length === 0) && (
              <p className="text-xs text-lemon-100/25 text-center py-3 italic">No workout templates yet — admin can add them</p>
            )}
            {(templates ?? []).map(tpl => (
              <button key={tpl.id} onClick={() => handleAddFromTemplate(tpl)} disabled={saving}
                className="w-full flex items-center gap-3 bg-bark-700/60 hover:bg-bark-700 rounded-xl p-3 text-left transition-all border border-transparent hover:border-lemon-500/20 disabled:opacity-50">
                <span className="text-2xl">{tpl.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-lemon-100 truncate">{tpl.name}</p>
                  <p className="text-xs text-lemon-100/40">{tpl.tag} · {tpl.duration_minutes} min · ~{tpl.calories_burned} kcal</p>
                </div>
                {saving ? <Loader2 size={14} className="text-lemon-400/60 animate-spin flex-shrink-0" /> : <Plus size={14} className="text-lemon-400/60 flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 pb-4 space-y-2">
          {loading && <p className="text-xs text-lemon-100/30 text-center py-4">Loading…</p>}
          {!loading && workouts.length === 0 && (
            <p className="text-xs text-lemon-100/30 text-center py-4">No workouts today. Add one above!</p>
          )}

          {workouts.map(w => {
            // Find matching template for exercise list
            const tpl = (templates ?? []).find(t => t.name === w.name)
            const exercises = tpl?.exercises ?? []
            return (
              <div key={w.id} className={`rounded-xl overflow-hidden border transition-all ${w.completed ? 'border-forest-700/40 bg-forest-900/30' : 'border-lemon-500/15 bg-bark-800/60'}`}>
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => handleToggleComplete(w)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${w.completed ? 'bg-forest-500/40 border border-forest-400/60' : 'border-2 border-lemon-100/20 hover:border-lemon-400/40'}`}>
                    {w.completed && <Check size={12} className="text-forest-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${w.completed ? 'text-lemon-100/50' : 'text-lemon-100'}`}>{w.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-lemon-100/30">{w.tag}</span>
                      <span className="flex items-center gap-1 text-xs text-lemon-100/30">
                        <Timer size={10} />{w.duration_minutes}m
                      </span>
                      <span className="flex items-center gap-1 text-xs text-lemon-100/30">
                        <Flame size={10} className="text-orange-400/60" />{w.calories_burned}
                      </span>
                    </div>
                  </div>
                  {exercises.length > 0 && (
                    <button onClick={() => setExpandedId(expandedId === w.id ? null : w.id)} className="text-lemon-100/30 hover:text-lemon-100/60 p-1">
                      {expandedId === w.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button onClick={() => handleDelete(w.id)} className="text-lemon-100/20 hover:text-red-400 transition-colors p-1">
                    <X size={14} />
                  </button>
                </div>

                {/* Exercise breakdown */}
                {expandedId === w.id && exercises.length > 0 && (
                  <div className="px-3 pb-3 space-y-1.5 border-t border-lemon-500/10 pt-2 animate-fade-in">
                    {exercises
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(ex => {
                        const Icon = TYPE_ICON[ex.type]
                        return (
                          <div key={ex.id} className="flex items-center gap-2 text-xs text-lemon-100/50">
                            <Icon size={11} className={TYPE_COLOR[ex.type]} />
                            <span className="flex-1">{ex.name}</span>
                            <span className="text-lemon-100/30">
                              {ex.sets ? `${ex.sets}×${ex.reps}` : ex.duration_seconds ? `${ex.duration_seconds}s` : '—'}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly stats */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">This Week</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Workouts', value: completedThisWeek.length, icon: Dumbbell, color: 'text-lemon-400' },
            { label: 'Minutes',  value: totalMinsThisWeek,       icon: Timer,    color: 'text-forest-400' },
            { label: 'Kcal',     value: totalCalsBurnedWeek,      icon: Flame,    color: 'text-orange-400' },
          ].map(m => (
            <div key={m.label} className="bg-bark-800/60 rounded-xl p-3 text-center">
              <m.icon size={16} className={`${m.color} mx-auto mb-1`} />
              <p className={`font-display text-lg font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-lemon-100/40">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
