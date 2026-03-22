'use client'
import { useState } from 'react'
import { Play, Check, ChevronDown, ChevronUp, Timer, Flame, Dumbbell, Wind, Heart } from 'lucide-react'

type Exercise = {
  id: number
  name: string
  sets?: number
  reps?: string
  duration?: string
  rest: string
  done: boolean
  type: 'strength' | 'cardio' | 'flexibility'
}

const workoutPlans = {
  today: {
    name: 'Full Body Endurance',
    tag: 'Cardio + Strength',
    duration: '45 min',
    calories: 320,
    emoji: '⚡',
    exercises: [
      { id: 1, name: 'Warm-up Jog', duration: '5 min', rest: '—', done: true, type: 'cardio' as const },
      { id: 2, name: 'Jump Rope', duration: '3 min', rest: '1 min', done: true, type: 'cardio' as const },
      { id: 3, name: 'Bodyweight Squats', sets: 3, reps: '15', rest: '45s', done: false, type: 'strength' as const },
      { id: 4, name: 'Push-ups', sets: 3, reps: '12', rest: '45s', done: false, type: 'strength' as const },
      { id: 5, name: 'Plank Hold', duration: '45s', rest: '30s', done: false, type: 'strength' as const },
      { id: 6, name: 'Mountain Climbers', duration: '1 min', rest: '30s', done: false, type: 'cardio' as const },
      { id: 7, name: 'Lunges', sets: 3, reps: '12 each', rest: '45s', done: false, type: 'strength' as const },
      { id: 8, name: 'Cool Down Stretch', duration: '5 min', rest: '—', done: false, type: 'flexibility' as const },
    ] as Exercise[],
  },
}

const weekSchedule = [
  { day: 'Mon', workout: 'Full Body', done: true, color: 'lemon' },
  { day: 'Tue', workout: 'Cardio Run', done: true, color: 'forest' },
  { day: 'Wed', workout: 'Rest', done: false, color: 'rest' },
  { day: 'Thu', workout: 'Upper Body', done: true, color: 'lemon' },
  { day: 'Fri', workout: 'Endurance', done: false, color: 'forest', today: true },
  { day: 'Sat', workout: 'HIIT', done: false, color: 'lemon' },
  { day: 'Sun', workout: 'Rest', done: false, color: 'rest' },
]

const typeIcon = { strength: Dumbbell, cardio: Wind, flexibility: Heart }
const typeColor = { strength: 'text-lemon-400', cardio: 'text-forest-400', flexibility: 'text-purple-400' }

export default function WorkoutPlanner() {
  const [exercises, setExercises] = useState(workoutPlans.today.exercises)
  const [timerActive, setTimerActive] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [showSchedule, setShowSchedule] = useState(false)

  const completed = exercises.filter(e => e.done).length
  const progress = Math.round((completed / exercises.length) * 100)

  const toggleExercise = (id: number) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e))
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Today's Workout Card */}
      <div className="card p-4 lemon-glow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{workoutPlans.today.emoji}</span>
              <h2 className="font-display text-lg font-bold text-lemon-200">{workoutPlans.today.name}</h2>
            </div>
            <span className="text-xs bg-lemon-500/15 text-lemon-400 border border-lemon-500/25 rounded-full px-2.5 py-0.5">
              {workoutPlans.today.tag}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-lemon-100/40">Duration</p>
                <p className="text-sm font-semibold text-lemon-200">{workoutPlans.today.duration}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-lemon-100/40">Burn</p>
                <p className="text-sm font-semibold text-orange-400 flex items-center gap-0.5">
                  <Flame size={12} />{workoutPlans.today.calories}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-lemon-100/50 mb-2">
          <span>{completed}/{exercises.length} exercises</span>
          <span>{progress}% done</span>
        </div>
        <div className="progress-bar h-2.5">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Workout Timer */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lemon-500/15 flex items-center justify-center">
            <Timer size={18} className="text-lemon-400" />
          </div>
          <div>
            <p className="text-xs text-lemon-100/50">Workout Timer</p>
            <p className="font-display text-xl font-bold text-lemon-300 tabular-nums">{formatTime(seconds)}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setTimerActive(!timerActive)
            if (!timerActive) {
              const interval = setInterval(() => setSeconds(s => s + 1), 1000)
              setTimeout(() => clearInterval(interval), 60 * 60 * 1000)
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            timerActive
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-lemon-500/20 text-lemon-300 border border-lemon-500/30 lemon-glow'
          }`}
        >
          <Play size={14} className={timerActive ? 'fill-red-400' : 'fill-lemon-300'} />
          {timerActive ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* Exercise List */}
      <div className="card overflow-hidden">
        <div className="p-4 pb-2">
          <p className="text-sm font-semibold text-lemon-200">Exercises</p>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {exercises.map((ex) => {
            const Icon = typeIcon[ex.type]
            return (
              <button
                key={ex.id}
                onClick={() => toggleExercise(ex.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  ex.done
                    ? 'bg-forest-900/40 border border-forest-700/30'
                    : 'bg-bark-800/60 border border-transparent hover:border-lemon-500/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  ex.done ? 'bg-forest-500/40 border border-forest-400/60' : 'border-2 border-lemon-100/20'
                }`}>
                  {ex.done && <Check size={12} className="text-forest-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${ex.done ? 'text-lemon-100/40 line-through' : 'text-lemon-100'}`}>
                    {ex.name}
                  </p>
                  <p className="text-xs text-lemon-100/30 mt-0.5">
                    {ex.sets ? `${ex.sets} sets × ${ex.reps}` : ex.duration}
                    {ex.rest !== '—' && ` · Rest ${ex.rest}`}
                  </p>
                </div>
                <Icon size={14} className={`flex-shrink-0 ${typeColor[ex.type]} ${ex.done ? 'opacity-40' : ''}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="card overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => setShowSchedule(!showSchedule)}
        >
          <p className="text-sm font-semibold text-lemon-200">Weekly Schedule</p>
          {showSchedule ? <ChevronUp size={16} className="text-lemon-100/40" /> : <ChevronDown size={16} className="text-lemon-100/40" />}
        </button>
        {showSchedule && (
          <div className="px-4 pb-4 space-y-2 animate-fade-in">
            {weekSchedule.map((s) => (
              <div key={s.day} className={`flex items-center gap-3 p-3 rounded-xl ${s.today ? 'bg-lemon-500/10 border border-lemon-500/25' : 'bg-bark-800/40'}`}>
                <span className={`text-xs font-semibold w-8 ${s.today ? 'text-lemon-400' : 'text-lemon-100/40'}`}>{s.day}</span>
                <span className={`flex-1 text-sm ${s.workout === 'Rest' ? 'text-lemon-100/25' : s.today ? 'text-lemon-200' : 'text-lemon-100/70'}`}>
                  {s.workout}
                </span>
                {s.done && <Check size={14} className="text-forest-400" />}
                {s.today && !s.done && <span className="text-xs bg-lemon-500/20 text-lemon-400 px-2 py-0.5 rounded-full">Today</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
