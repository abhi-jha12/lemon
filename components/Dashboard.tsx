'use client'
import { useState } from 'react'
import { Flame, Droplets, Moon, TrendingUp, Zap, Target, ChevronRight, Award } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

const weekData = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const workoutDays = [true, true, false, true, true, false, false]
const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

export default function Dashboard() {
  const [water, setWater] = useState(5)
  const calorieGoal = 2200
  const calorieConsumed = 1480
  const calorieBurned = 320
  const calorieNet = calorieConsumed - calorieBurned
  const caloriePercent = Math.round((calorieNet / calorieGoal) * 100)

  const radialData = [{ value: caloriePercent, fill: '#eab308' }]

  const stats = [
    { label: 'Protein', value: '82g', goal: '120g', color: 'text-lemon-400', bar: 68 },
    { label: 'Carbs', value: '165g', goal: '220g', color: 'text-forest-400', bar: 75 },
    { label: 'Fat', value: '44g', goal: '65g', color: 'text-lemon-600', bar: 68 },
  ]

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Streak Banner */}
      <div className="card p-4 lemon-glow flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-lemon-500/20 flex items-center justify-center flex-shrink-0">
          <Award size={24} className="text-lemon-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-lemon-100/50 mb-0.5">Current Streak</p>
          <p className="font-display text-xl font-bold text-lemon-300">4 Days <span className="text-base">🔥</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-lemon-100/50">Best</p>
          <p className="text-sm font-semibold text-lemon-100">12 days</p>
        </div>
      </div>

      {/* Calorie Ring + Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 card p-4">
          <p className="text-xs text-lemon-100/50 mb-2 font-medium">Today's Calories</p>
          <div className="relative h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="65%" outerRadius="90%"
                barSize={8}
                data={[{ value: 100, fill: 'rgba(234,179,8,0.1)' }, ...radialData]}
                startAngle={90} endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-bold text-lemon-300">{calorieNet}</span>
              <span className="text-xs text-lemon-100/40">of {calorieGoal}</span>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-center">
              <p className="text-xs text-lemon-100/40">Eaten</p>
              <p className="text-sm font-semibold text-lemon-200">{calorieConsumed}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-lemon-100/40">Burned</p>
              <p className="text-sm font-semibold text-forest-400">{calorieBurned}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-lemon-100/40">Left</p>
              <p className="text-sm font-semibold text-lemon-400">{calorieGoal - calorieNet}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          {/* Water */}
          <div className="card p-3 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-xs text-lemon-100/50">Water</span>
            </div>
            <p className="font-display text-lg font-bold text-blue-300">{water}<span className="text-sm text-lemon-100/40">/8</span></p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setWater(i + 1)}
                  className={`w-4 h-4 rounded-full transition-all ${i < water ? 'bg-blue-400' : 'bg-blue-900/40'}`}
                />
              ))}
            </div>
          </div>

          {/* Sleep */}
          <div className="card p-3 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Moon size={14} className="text-purple-400" />
              <span className="text-xs text-lemon-100/50">Sleep</span>
            </div>
            <p className="font-display text-lg font-bold text-purple-300">7.2<span className="text-sm text-lemon-100/40">h</span></p>
            <p className="text-xs text-lemon-100/30 mt-1">Goal: 8h</p>
          </div>
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-lemon-200">Macros Today</p>
          <span className="text-xs text-lemon-100/40">% of goal</span>
        </div>
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-lemon-100/60">{s.label}</span>
                <span className={`text-xs font-medium ${s.color}`}>{s.value} <span className="text-lemon-100/30">/ {s.goal}</span></span>
              </div>
              <div className="progress-bar h-1.5">
                <div className="progress-fill" style={{ width: `${s.bar}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-lemon-200">Weekly Activity</p>
          <div className="flex items-center gap-1 text-xs text-forest-400">
            <TrendingUp size={12} />
            <span>4/7 days</span>
          </div>
        </div>
        <div className="flex justify-between">
          {weekData.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  i === today
                    ? 'bg-lemon-500/30 border border-lemon-400/50 lemon-glow'
                    : workoutDays[i]
                    ? 'bg-forest-800/60 border border-forest-600/40'
                    : 'bg-bark-600/40 border border-bark-500/20'
                }`}
              >
                {workoutDays[i] ? (
                  <Zap size={14} className={i === today ? 'text-lemon-300' : 'text-forest-400'} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-bark-500" />
                )}
              </div>
              <span className={`text-xs ${i === today ? 'text-lemon-400 font-semibold' : 'text-lemon-100/30'}`}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Goals */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">Today's Goals</p>
        <div className="space-y-2">
          {[
            { label: 'Hit 10,000 steps', done: true },
            { label: 'Drink 8 glasses of water', done: water >= 8 },
            { label: 'Complete workout', done: false },
            { label: 'Log all meals', done: false },
          ].map((goal, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                goal.done ? 'bg-forest-500/30 border border-forest-400/60' : 'border border-lemon-100/20'
              }`}>
                {goal.done && <span className="text-forest-400 text-xs">✓</span>}
              </div>
              <span className={`text-sm ${goal.done ? 'text-lemon-100/40 line-through' : 'text-lemon-100/70'}`}>
                {goal.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
