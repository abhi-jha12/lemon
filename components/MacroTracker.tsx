'use client'
import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts'
import { TrendingDown, TrendingUp, Minus, Target, Scale, Activity, Plus, X, Loader2, Check } from 'lucide-react'
import { useWeight, useWeeklyMeals, useDailyLog } from '@/hooks/useData'
import type { MealLog } from '@/types'

const GOALS = { calories: 2200, protein: 120, carbs: 220, fat: 65 }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bark-700 border border-lemon-500/20 rounded-xl p-2.5 text-xs">
        <p className="text-lemon-300 font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'weight' ? ' kg' : ''}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function MacroTracker() {
  const { logs: weightLogs, latest, change, loading: wLoading, addWeight, deleteWeight } = useWeight(60)
  const { data: weekMeals, loading: mealsLoading } = useWeeklyMeals()
  const { sleep, setSleep, setSteps, steps } = useDailyLog()

  const [showWeightForm, setShowWeightForm] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [weightNote, setWeightNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleAddWeight = async () => {
    const kg = parseFloat(newWeight)
    if (!kg || kg < 20 || kg > 300) return
    setSaving(true)
    try {
      await addWeight(kg, weightNote || undefined)
      showToast(`Logged ${kg} kg`)
      setNewWeight(''); setWeightNote(''); setShowWeightForm(false)
    } catch { showToast('Failed to save weight') }
    finally { setSaving(false) }
  }

  // Build daily calorie data from weekMeals
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const calByDay = days.map((date, i) => {
    const dayMeals = (weekMeals ?? []).filter((m: MealLog) => m.date === date)
    return {
      day: dayLabels[new Date(date + 'T12:00:00').getDay() === 0 ? 6 : new Date(date + 'T12:00:00').getDay() - 1],
      calories: dayMeals.reduce((s, m: MealLog) => s + m.calories, 0),
      goal: GOALS.calories,
    }
  })

  // Today's macros from weekMeals
  const todayStr = new Date().toISOString().split('T')[0]
  const todayMeals = (weekMeals ?? []).filter((m: MealLog) => m.date === todayStr)
  const today = todayMeals.reduce((acc, m: MealLog) => ({
    calories: acc.calories + m.calories, protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const macros = [
    { name: 'Protein', value: today.protein, goal: GOALS.protein, color: '#eab308', text: 'text-lemon-400', desc: 'Muscle repair & growth' },
    { name: 'Carbs',   value: today.carbs,   goal: GOALS.carbs,   color: '#22c55e', text: 'text-forest-400', desc: 'Primary energy source' },
    { name: 'Fat',     value: today.fat,     goal: GOALS.fat,     color: '#a78bfa', text: 'text-purple-400', desc: 'Hormones & absorption' },
  ]

  const TrendIcon  = change < 0 ? TrendingDown : change > 0 ? TrendingUp : Minus
  const trendColor = change < 0 ? 'text-forest-400' : change > 0 ? 'text-red-400' : 'text-lemon-400'

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Weight', value: latest ? `${latest.weight_kg}kg` : '—', icon: Scale, sub: 'Current', color: 'text-lemon-400' },
          { label: 'Goal',   value: '68 kg', icon: Target,   sub: latest ? `${Math.abs(68 - latest.weight_kg).toFixed(1)} to go` : '—', color: 'text-forest-400' },
          { label: 'BMR',    value: '1,840', icon: Activity, sub: 'kcal/day', color: 'text-purple-400' },
        ].map(m => (
          <div key={m.label} className="card p-3 text-center">
            <m.icon size={16} className={`${m.color} mx-auto mb-1.5`} />
            <p className={`font-display text-base font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-lemon-100/40 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={16} /><span>{toast}</span>
        </div>
      )}

      {/* Today Macros */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-lemon-200">Today's Macros</p>
          {mealsLoading && <Loader2 size={14} className="text-lemon-100/30 animate-spin" />}
        </div>
        <div className="space-y-4">
          {macros.map(m => {
            const pct = Math.min(Math.round((m.value / m.goal) * 100), 100)
            return (
              <div key={m.name}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div>
                    <span className={`text-sm font-medium ${m.text}`}>{m.name}</span>
                    <span className="text-xs text-lemon-100/30 ml-2">{m.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${m.text}`}>{m.value}g</span>
                    <span className="text-xs text-lemon-100/30"> / {m.goal}g</span>
                  </div>
                </div>
                <div className="progress-bar h-2.5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.color }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-lemon-100/30">{pct}% of goal</span>
                  <span className="text-xs text-lemon-100/30">{m.goal - m.value}g left</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Tracking */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">Daily Tracking</p>
        <div className="space-y-3">
          {/* Sleep */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-lemon-100/60">Sleep hours</span>
              <span className="text-xs text-purple-400 font-semibold">{sleep}h / 8h goal</span>
            </div>
            <div className="flex gap-1.5">
              {[5,6,7,7.5,8,9].map(h => (
                <button key={h} onClick={() => setSleep(h)}
                  className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${sleep === h ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' : 'bg-bark-700/60 text-lemon-100/30 hover:text-lemon-100/60'}`}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
          {/* Steps */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-lemon-100/60">Steps</span>
              <span className="text-xs text-lemon-400 font-semibold">{steps.toLocaleString()} / 10,000</span>
            </div>
            <div className="flex gap-1.5">
              {[2000,4000,6000,8000,10000,12000].map(s => (
                <button key={s} onClick={() => setSteps(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${steps === s ? 'bg-lemon-500/25 text-lemon-300 border border-lemon-500/40' : 'bg-bark-700/60 text-lemon-100/30 hover:text-lemon-100/60'}`}>
                  {s>=1000?`${s/1000}k`:s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-4">Calorie History (7 days)</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calByDay} barSize={22}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(253,224,71,0.35)', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="calories" fill="#eab308" fillOpacity={0.75} radius={[4,4,0,0]} />
              <Bar dataKey="goal"     fill="rgba(234,179,8,0.1)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Trend */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-lemon-200">Weight Trend</p>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon size={14} />
              <span className="text-sm font-semibold">{Math.abs(change)} kg</span>
            </div>
            <button onClick={() => setShowWeightForm(!showWeightForm)}
              className="w-7 h-7 rounded-lg bg-lemon-500/15 flex items-center justify-center border border-lemon-500/25 hover:bg-lemon-500/25 transition-all">
              <Plus size={13} className="text-lemon-400" />
            </button>
          </div>
        </div>

        {showWeightForm && (
          <div className="bg-bark-700/50 rounded-xl p-3 mb-4 space-y-2 animate-fade-in">
            <div className="flex gap-2">
              <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                placeholder="Weight (kg)"
                className="flex-1 bg-bark-800 rounded-lg px-3 py-2 text-sm text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/25" />
              <input value={weightNote} onChange={e => setWeightNote(e.target.value)}
                placeholder="Note (optional)"
                className="flex-1 bg-bark-800 rounded-lg px-3 py-2 text-sm text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/25" />
            </div>
            <button onClick={handleAddWeight} disabled={!newWeight || saving}
              className="w-full py-2 rounded-lg bg-lemon-500/20 text-lemon-300 text-sm font-medium border border-lemon-500/30 hover:bg-lemon-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Log Weight'}
            </button>
          </div>
        )}

        {wLoading
          ? <p className="text-xs text-lemon-100/30 text-center py-4">Loading…</p>
          : weightLogs.length === 0
            ? <p className="text-xs text-lemon-100/30 text-center py-4">No weight data yet. Log your weight above!</p>
            : (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightLogs.map(w => ({ date: w.date.slice(5), weight: w.weight_kg }))}>
                    <defs>
                      <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(253,224,71,0.35)', fontSize: 9 }} />
                    <YAxis hide domain={['auto','auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: '#22c55e', r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )
        }

        {/* Recent weight log */}
        {weightLogs.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-lemon-100/40 mb-2">Recent entries</p>
            {[...weightLogs].reverse().slice(0, 4).map(w => (
              <div key={w.id} className="flex items-center justify-between bg-bark-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-lemon-100/50">{new Date(w.date + 'T12:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="text-sm font-semibold text-lemon-300">{w.weight_kg} kg</span>
                {w.note && <span className="text-xs text-lemon-100/30 truncate max-w-20">{w.note}</span>}
                <button onClick={() => deleteWeight(w.id)} className="text-lemon-100/20 hover:text-red-400 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
