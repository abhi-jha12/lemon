'use client'
import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts'
import { TrendingDown, TrendingUp, Minus, Target, Scale, Activity } from 'lucide-react'

const weeklyCalories = [
  { day: 'Mon', calories: 1840, goal: 2200 },
  { day: 'Tue', calories: 1620, goal: 2200 },
  { day: 'Wed', calories: 2100, goal: 2200 },
  { day: 'Thu', calories: 1950, goal: 2200 },
  { day: 'Fri', calories: 1480, goal: 2200 },
  { day: 'Sat', calories: 0, goal: 2200 },
  { day: 'Sun', calories: 0, goal: 2200 },
]

const weightData = [
  { date: 'Feb 1', weight: 74.2 },
  { date: 'Feb 8', weight: 73.8 },
  { date: 'Feb 15', weight: 73.4 },
  { date: 'Feb 22', weight: 73.1 },
  { date: 'Mar 1', weight: 72.8 },
  { date: 'Mar 8', weight: 72.5 },
  { date: 'Mar 15', weight: 72.3 },
  { date: 'Mar 22', weight: 72.0 },
]

const macroHistory = [
  { day: 'Mon', protein: 88, carbs: 180, fat: 52 },
  { day: 'Tue', protein: 72, carbs: 155, fat: 44 },
  { day: 'Wed', protein: 95, carbs: 210, fat: 58 },
  { day: 'Thu', protein: 84, carbs: 195, fat: 50 },
  { day: 'Fri', protein: 82, carbs: 165, fat: 44 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bark-700 border border-lemon-500/20 rounded-xl p-2.5 text-xs">
        <p className="text-lemon-300 font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'weight' ? ' kg' : ' kcal'}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function MacroTracker() {
  const [view, setView] = useState<'week' | 'month'>('week')
  const goals = { calories: 2200, protein: 120, carbs: 220, fat: 65 }
  const today = { calories: 1480, protein: 82, carbs: 165, fat: 44 }

  const macros = [
    { name: 'Protein', value: today.protein, goal: goals.protein, unit: 'g', color: '#eab308', bg: 'bg-lemon-500/20', text: 'text-lemon-400', desc: 'Muscle repair & growth' },
    { name: 'Carbohydrates', value: today.carbs, goal: goals.carbs, unit: 'g', color: '#22c55e', bg: 'bg-forest-500/20', text: 'text-forest-400', desc: 'Primary energy source' },
    { name: 'Fat', value: today.fat, goal: goals.fat, unit: 'g', color: '#a78bfa', bg: 'bg-purple-500/20', text: 'text-purple-400', desc: 'Hormones & absorption' },
  ]

  const weightChange = weightData[weightData.length - 1].weight - weightData[0].weight
  const TrendIcon = weightChange < 0 ? TrendingDown : weightChange > 0 ? TrendingUp : Minus
  const trendColor = weightChange < 0 ? 'text-forest-400' : weightChange > 0 ? 'text-red-400' : 'text-lemon-400'

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Current', value: '72.0 kg', icon: Scale, sub: 'Body weight', color: 'text-lemon-400' },
          { label: 'Goal', value: '68 kg', icon: Target, sub: '4 kg to go', color: 'text-forest-400' },
          { label: 'BMR', value: '1,840', icon: Activity, sub: 'kcal/day', color: 'text-purple-400' },
        ].map(m => (
          <div key={m.label} className="card p-3 text-center">
            <m.icon size={16} className={`${m.color} mx-auto mb-1.5`} />
            <p className={`font-display text-base font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-lemon-100/40 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Today's Macros */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">Today's Macros</p>
        <div className="space-y-4">
          {macros.map((m) => {
            const pct = Math.round((m.value / m.goal) * 100)
            return (
              <div key={m.name}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className={`text-sm font-medium ${m.text}`}>{m.name}</span>
                    <span className="text-xs text-lemon-100/30 ml-2">{m.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${m.text}`}>{m.value}{m.unit}</span>
                    <span className="text-xs text-lemon-100/30"> / {m.goal}{m.unit}</span>
                  </div>
                </div>
                <div className="progress-bar h-2.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, background: m.color }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-lemon-100/30">{pct}% of goal</span>
                  <span className="text-xs text-lemon-100/30">{m.goal - m.value}{m.unit} left</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-lemon-200">Calorie History</p>
          <div className="flex gap-1 bg-bark-700/60 p-1 rounded-lg">
            {(['week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-3 py-1 rounded-md transition-all ${view === v ? 'bg-lemon-500/25 text-lemon-300' : 'text-lemon-100/40'}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCalories} barSize={22}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(253,224,71,0.35)', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="calories" fill="#eab308" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              <Bar dataKey="goal" fill="rgba(234,179,8,0.1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-lemon-500/70" />
            <span className="text-xs text-lemon-100/40">Consumed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-lemon-500/15" />
            <span className="text-xs text-lemon-100/40">Goal</span>
          </div>
        </div>
      </div>

      {/* Weight Trend */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-lemon-200">Weight Trend</p>
          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon size={14} />
            <span className="text-sm font-semibold">{Math.abs(weightChange).toFixed(1)} kg</span>
            <span className="text-xs text-lemon-100/40">this month</span>
          </div>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(253,224,71,0.35)', fontSize: 9 }} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: '#22c55e', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macro Distribution */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-4">Weekly Macro Breakdown</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={macroHistory} barSize={12}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(253,224,71,0.35)', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="protein" fill="#eab308" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="carbs" fill="#22c55e" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
              <Bar dataKey="fat" fill="#a78bfa" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2">
          {[['Protein', 'bg-lemon-500/80'], ['Carbs', 'bg-forest-500/70'], ['Fat', 'bg-purple-500/70']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
              <span className="text-xs text-lemon-100/40">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
