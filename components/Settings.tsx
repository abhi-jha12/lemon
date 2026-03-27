'use client'
import { useState, useEffect } from 'react'
import { Settings2, Save, Loader2, Check, User, Target, Cigarette, Ruler } from 'lucide-react'
import { useUserSettings } from '@/hooks/useData'
import { calculateBMR, calculateTDEE, type UserSettings } from '@/types'

type Section = 'goals' | 'profile' | 'smoking'

export default function Settings() {
  const { settings, loading, save: update } = useUserSettings()
  const [section, setSection] = useState<Section>('goals')
  const [form, setForm] = useState<Partial<UserSettings>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const set = (k: keyof UserSettings, v: string | number | null) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await update(form)
      showToast('Settings saved ✓')
    } catch { showToast('Failed to save') }
    finally { setSaving(false) }
  }

  // Live BMR preview — needs current weight, not goal weight
  // We don't have weight logs in Settings, so we can only show BMR if weight_goal_kg
  // is set as a proxy. A note is shown to the user to update with actual weight.
  const weight = settings?.weight_goal_kg ?? null
  const bmr = (settings && weight)
    ? calculateBMR(settings, Number(weight))
    : null
  const tdee = bmr && settings?.activity_level
    ? calculateTDEE(settings, Number(weight))
    : null

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'goals',   label: 'Goals',   icon: Target },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'smoking', label: 'Smoking', icon: Cigarette },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={20} className="animate-spin text-lemon-400" />
    </div>
  )

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={14} className="flex-shrink-0" /> {toast}
        </div>
      )}

      <div className="card p-4 lemon-glow flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lemon-500/20 flex items-center justify-center">
          <Settings2 size={18} className="text-lemon-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-lemon-200">Settings</p>
          <p className="text-xs text-lemon-100/40">Your personal goals & profile</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              section === id ? 'tab-active' : 'border-transparent text-lemon-100/40 hover:text-lemon-100/60'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── GOALS ── */}
      {section === 'goals' && (
        <div className="card p-4 space-y-4">
          <p className="text-xs text-lemon-100/40 font-medium uppercase tracking-wide">Daily nutrition</p>
          {([
            { key: 'calorie_goal', label: 'Calorie goal', unit: 'kcal', min: 1000, max: 5000 },
            { key: 'protein_goal', label: 'Protein goal', unit: 'g',    min: 20,   max: 400 },
            { key: 'carbs_goal',   label: 'Carbs goal',   unit: 'g',    min: 20,   max: 600 },
            { key: 'fat_goal',     label: 'Fat goal',     unit: 'g',    min: 10,   max: 200 },
          ] as { key: keyof UserSettings; label: string; unit: string; min: number; max: number }[]).map(({ key, label, unit, min, max }) => (
            <div key={String(key)}>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-lemon-100/70">{label}</label>
                <span className="text-sm font-semibold text-lemon-400">{form[key] ?? ''} {unit}</span>
              </div>
              <input
                type="range"
                min={min} max={max} step={unit === 'kcal' ? 50 : 5}
                value={Number(form[key] ?? 0)}
                onChange={e => set(key, Number(e.target.value))}
                className="w-full accent-yellow-400"
              />
              <div className="flex justify-between text-xs text-lemon-100/20 mt-0.5">
                <span>{min}</span><span>{max}</span>
              </div>
            </div>
          ))}

          <div className="border-t border-lemon-500/10 pt-3">
            <p className="text-xs text-lemon-100/40 font-medium uppercase tracking-wide mb-3">Weight & fitness</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-lemon-100/60">Weight goal (kg)</label>
                <input
                  type="number" min={30} max={250} step={0.5}
                  value={form.weight_goal_kg ?? ''}
                  onChange={e => set('weight_goal_kg', e.target.value ? Number(e.target.value) : null)}
                  placeholder="75"
                  className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 placeholder-lemon-100/30 focus:outline-none focus:border-lemon-500/40"
                />
              </div>
              <div>
                <label className="text-xs text-lemon-100/60">Weekly workouts</label>
                <input
                  type="number" min={0} max={14}
                  value={form.weekly_workout_target ?? 4}
                  onChange={e => set('weekly_workout_target', Number(e.target.value))}
                  className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 focus:outline-none focus:border-lemon-500/40"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE ── */}
      {section === 'profile' && (
        <div className="card p-4 space-y-4">
          <p className="text-xs text-lemon-100/40 font-medium uppercase tracking-wide">Body profile — for BMR</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-lemon-100/60">Age</label>
              <input
                type="number" min={10} max={100}
                value={form.age ?? ''}
                onChange={e => set('age', e.target.value ? Number(e.target.value) : null)}
                placeholder="28"
                className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 placeholder-lemon-100/30 focus:outline-none focus:border-lemon-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-lemon-100/60">Height (cm)</label>
              <input
                type="number" min={100} max={250}
                value={form.height_cm ?? ''}
                onChange={e => set('height_cm', e.target.value ? Number(e.target.value) : null)}
                placeholder="175"
                className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 placeholder-lemon-100/30 focus:outline-none focus:border-lemon-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-lemon-100/60">Sex (for BMR formula)</label>
            <div className="flex gap-2 mt-1.5">
              {(['male', 'female', 'other'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => set('sex', s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border capitalize transition-all ${
                    form.sex === s ? 'tab-active' : 'border-lemon-500/15 text-lemon-100/40 hover:border-lemon-500/30'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-lemon-100/60">Activity level</label>
            <div className="space-y-1.5 mt-1.5">
              {([
                { id: 'sedentary',  label: 'Sedentary',   sub: 'Desk job, no exercise' },
                { id: 'light',      label: 'Light',        sub: '1–3 days/week' },
                { id: 'moderate',   label: 'Moderate',     sub: '3–5 days/week' },
                { id: 'active',     label: 'Active',       sub: '6–7 days/week' },
                { id: 'very_active',label: 'Very active',  sub: 'Physical job + gym' },
              ] as const).map(({ id, label, sub }) => (
                <button
                  key={id}
                  onClick={() => set('activity_level', id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left ${
                    form.activity_level === id ? 'tab-active' : 'border-lemon-500/10 hover:border-lemon-500/20'
                  }`}
                >
                  <span className="text-sm text-lemon-100/80">{label}</span>
                  <span className="text-xs text-lemon-100/30">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live BMR/TDEE preview */}
          {bmr && (
            <div className="bg-lemon-500/10 border border-lemon-500/20 rounded-xl p-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-lemon-100/40">BMR (Mifflin-St Jeor)</p>
                  <p className="text-lg font-bold text-lemon-400">{bmr} kcal</p>
                </div>
                {tdee && (
                  <div className="text-right">
                    <p className="text-xs text-lemon-100/40">TDEE (maintenance)</p>
                    <p className="text-lg font-bold text-forest-400">{tdee} kcal</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-lemon-100/30 mt-1">Based on your weight goal (proxy). Log your current weight in the Progress tab for accurate BMR.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SMOKING ── */}
      {section === 'smoking' && (
        <div className="card p-4 space-y-4">
          <p className="text-xs text-lemon-100/40 font-medium uppercase tracking-wide">Smoking settings</p>

          <div>
            <label className="text-xs text-lemon-100/60">Quit date (leave blank if still smoking)</label>
            <input
              type="date"
              value={form.smoking_quit_date ?? ''}
              onChange={e => set('smoking_quit_date', e.target.value || null)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 focus:outline-none focus:border-lemon-500/40"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-lemon-100/70">Baseline cigarettes/day</label>
              <span className="text-sm font-semibold text-lemon-400">{form.cigarettes_per_day_baseline ?? 10}</span>
            </div>
            <input
              type="range" min={1} max={60}
              value={form.cigarettes_per_day_baseline ?? 10}
              onChange={e => set('cigarettes_per_day_baseline', Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <p className="text-xs text-lemon-100/30 mt-0.5">How many you smoked before trying to cut down</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-lemon-100/60">Pack price (₹)</label>
              <input
                type="number" min={50} max={2000}
                value={form.pack_price_inr ?? 250}
                onChange={e => set('pack_price_inr', Number(e.target.value))}
                className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 focus:outline-none focus:border-lemon-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-lemon-100/60">Cigarettes per pack</label>
              <input
                type="number" min={10} max={25}
                value={form.cigarettes_per_pack ?? 20}
                onChange={e => set('cigarettes_per_pack', Number(e.target.value))}
                className="mt-1 w-full bg-bark-600/40 border border-lemon-500/15 rounded-xl px-3 py-2 text-sm text-lemon-100 focus:outline-none focus:border-lemon-500/40"
              />
            </div>
          </div>

          {/* Money preview */}
          {form.pack_price_inr && form.cigarettes_per_pack && form.cigarettes_per_day_baseline && (
            <div className="bg-lemon-500/10 border border-lemon-500/20 rounded-xl p-3">
              <p className="text-xs text-lemon-100/40 mb-1">If you quit completely</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-lemon-100/40">Per month</p>
                  <p className="text-base font-bold text-lemon-400">
                    ₹{Math.round((form.cigarettes_per_day_baseline * 30 * form.pack_price_inr) / form.cigarettes_per_pack)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-lemon-100/40">Per year</p>
                  <p className="text-base font-bold text-forest-400">
                    ₹{Math.round((form.cigarettes_per_day_baseline * 365 * form.pack_price_inr) / form.cigarettes_per_pack).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-lemon-500/20 border border-lemon-500/40 text-lemon-300 text-sm font-semibold hover:bg-lemon-500/30 transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save changes
      </button>
    </div>
  )
}
