'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Plus, Pencil, Trash2, Loader2, Check, X, ChevronDown, ChevronUp, LogOut, UtensilsCrossed, Dumbbell, ToggleLeft, ToggleRight, Bell } from 'lucide-react'
import type { MealTemplate, WorkoutTemplate } from '@/types'
import AdminNotifications from '@/components/AdminNotifications'

type Tab = 'meals' | 'workouts' | 'notifications'

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login')
  }, [user, authLoading, router])

  const [tab, setTab] = useState<Tab>('meals')

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-bark-900 flex items-center justify-center">
        <Loader2 size={28} className="text-lemon-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bark-900 relative overflow-hidden">
      <div className="blob-bg w-96 h-96 bg-lemon-500 top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <div className="blob-bg w-80 h-80 bg-forest-600 bottom-0 left-0 -translate-x-1/3" />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-4 border-b border-lemon-500/10" style={{ background: 'rgba(26,26,14,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍋</span>
            <div>
              <h1 className="font-display text-base font-bold text-lemon-300 italic">Lemon Admin</h1>
              <p className="text-xs text-lemon-100/40">Manage templates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-lemon-100/40 hidden sm:block">{user.name}</span>
            <button onClick={() => { logout(); router.push('/login') }}
              className="flex items-center gap-1.5 text-xs text-lemon-100/50 hover:text-lemon-300 transition-colors px-3 py-1.5 rounded-lg border border-lemon-500/15 hover:border-lemon-500/30">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'meals'         as Tab, label: 'Meal Templates',    icon: <UtensilsCrossed size={15} /> },
            { key: 'workouts'      as Tab, label: 'Workout Templates', icon: <Dumbbell size={15} /> },
            { key: 'notifications' as Tab, label: 'Notifications',     icon: <Bell size={15} /> },
          ]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                tab === key ? 'tab-active' : 'border-lemon-500/15 text-lemon-100/40 hover:text-lemon-100/70'}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {tab === 'meals'         && <MealTemplatesAdmin />}
        {tab === 'workouts'      && <WorkoutTemplatesAdmin />}
        {tab === 'notifications' && <AdminNotifications />}
      </main>
    </div>
  )
}

// ─── Meal Templates Admin ──────────────────────────────────────────────────

function MealTemplatesAdmin() {
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState<MealTemplate | null>(null)
  const [toast, setToast]         = useState('')

  const CATEGORIES = ['Breakfast','Lunch','Snack','Dinner','General'] as const

  const showToastMsg = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/meals')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (t: MealTemplate) => {
    await fetch('/api/admin/meals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }) })
    await load()
    showToastMsg(`${t.name} ${t.is_active ? 'deactivated' : 'activated'}`)
  }

  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch('/api/admin/meals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }) })
    await load()
    showToastMsg(`Deleted "${name}"`)
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={14} />{toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-lemon-100/60">{templates.length} templates</p>
        <button onClick={() => { setEditItem(null); setShowForm(!showForm) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lemon-500/20 text-lemon-300 text-xs font-medium border border-lemon-500/30 hover:bg-lemon-500/30 transition-all">
          <Plus size={13} /> Add Meal
        </button>
      </div>

      {showForm && <MealForm initial={editItem} onSaved={() => { setShowForm(false); setEditItem(null); load() }} onCancel={() => { setShowForm(false); setEditItem(null) }} categories={CATEGORIES} />}

      {loading ? <div className="text-center py-8"><Loader2 size={22} className="text-lemon-400/50 animate-spin mx-auto" /></div> : (
        <div className="space-y-2">
          {CATEGORIES.map(cat => {
            const items = templates.filter(t => t.category === cat)
            if (!items.length) return null
            return (
              <div key={cat} className="card overflow-hidden">
                <div className="px-4 py-2.5 bg-bark-700/40 border-b border-lemon-500/10">
                  <span className="text-xs font-semibold text-lemon-400/80">{cat}</span>
                </div>
                {items.map(t => (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-3 border-b border-lemon-500/5 last:border-0 ${!t.is_active ? 'opacity-40' : ''}`}>
                    <span className="text-xl w-7 text-center">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-lemon-100 font-medium truncate">{t.name}</p>
                      <p className="text-xs text-lemon-100/40">{t.calories} kcal · P:{t.protein}g · C:{t.carbs}g · F:{t.fat}g</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleActive(t)} title={t.is_active ? 'Deactivate' : 'Activate'}
                        className="text-lemon-100/40 hover:text-lemon-300 transition-colors p-1">
                        {t.is_active ? <ToggleRight size={18} className="text-forest-400" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => { setEditItem(t); setShowForm(true) }}
                        className="text-lemon-100/40 hover:text-lemon-300 transition-colors p-1"><Pencil size={14} /></button>
                      <button onClick={() => deleteTemplate(t.id, t.name)}
                        className="text-lemon-100/40 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MealForm({ initial, onSaved, onCancel, categories }: {
  initial: MealTemplate | null
  onSaved: () => void
  onCancel: () => void
  categories: readonly string[]
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '', emoji: initial?.emoji ?? '🍽️', calories: String(initial?.calories ?? ''),
    protein: String(initial?.protein ?? ''), carbs: String(initial?.carbs ?? ''),
    fat: String(initial?.fat ?? ''), category: initial?.category ?? 'General',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const method = initial ? 'PATCH' : 'POST'
      const body   = initial ? { ...form, id: initial.id } : form
      const res = await fetch('/api/admin/meals', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 animate-fade-in border-lemon-500/25">
      <p className="text-sm font-semibold text-lemon-200">{initial ? 'Edit Meal' : 'New Meal Template'}</p>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2">
        <input value={form.emoji} onChange={f('emoji')} className="w-12 bg-bark-800 rounded-xl text-center text-xl border border-lemon-500/20 focus:border-lemon-400/50 outline-none p-2" />
        <input value={form.name} onChange={f('name')} placeholder="Meal name *" required
          className="flex-1 bg-bark-800 rounded-xl px-3 py-2 text-sm text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/20" />
      </div>
      <select value={form.category} onChange={f('category')}
        className="w-full bg-bark-800 rounded-xl px-3 py-2 text-sm text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none">
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="grid grid-cols-4 gap-2">
        {[['calories','Kcal *'],['protein','Protein g'],['carbs','Carbs g'],['fat','Fat g']].map(([k,l]) => (
          <input key={k} type="number" value={form[k as keyof typeof form]} onChange={f(k)} placeholder={l}
            className="bg-bark-800 rounded-xl px-2 py-2 text-xs text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/25 w-full" />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-lemon-500/20 text-sm text-lemon-100/50 hover:text-lemon-100/70 transition-all flex items-center justify-center gap-1">
          <X size={13} /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 rounded-xl bg-lemon-500/25 text-lemon-300 text-sm font-medium border border-lemon-500/30 hover:bg-lemon-500/35 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {initial ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// ─── Workout Templates Admin ───────────────────────────────────────────────

function WorkoutTemplatesAdmin() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [toast, setToast]         = useState('')

  const showToastMsg = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/workouts')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (t: WorkoutTemplate) => {
    await fetch('/api/admin/workouts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }) })
    await load()
    showToastMsg(`${t.name} ${t.is_active ? 'deactivated' : 'activated'}`)
  }

  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch('/api/admin/workouts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }) })
    await load()
    showToastMsg(`Deleted "${name}"`)
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={14} />{toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-lemon-100/60">{templates.length} templates</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lemon-500/20 text-lemon-300 text-xs font-medium border border-lemon-500/30 hover:bg-lemon-500/30 transition-all">
          <Plus size={13} /> Add Workout
        </button>
      </div>

      {showForm && <WorkoutForm onSaved={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />}

      {loading ? <div className="text-center py-8"><Loader2 size={22} className="text-lemon-400/50 animate-spin mx-auto" /></div> : (
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className={`card overflow-hidden ${!t.is_active ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-3 p-4">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-lemon-100">{t.name}</p>
                  <p className="text-xs text-lemon-100/40">{t.tag} · {t.duration_minutes}m · ~{t.calories_burned} kcal</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-lemon-100/30">{t.exercises?.length ?? 0} ex</span>
                  <button onClick={() => toggleActive(t)} className="text-lemon-100/40 hover:text-lemon-300 p-1">
                    {t.is_active ? <ToggleRight size={18} className="text-forest-400" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="text-lemon-100/40 hover:text-lemon-300 p-1">
                    {expanded === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => deleteTemplate(t.id, t.name)} className="text-lemon-100/40 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
              {expanded === t.id && (
                <div className="px-4 pb-4 space-y-1.5 border-t border-lemon-500/10 pt-3 animate-fade-in">
                  {(t.exercises ?? []).map((ex, i) => (
                    <div key={ex.id ?? i} className="flex items-center gap-2 text-xs text-lemon-100/50 bg-bark-800/40 rounded-lg px-3 py-2">
                      <span className="w-4 text-lemon-100/25">{ex.sort_order}.</span>
                      <span className="flex-1">{ex.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-lemon-100/30 ${ex.type === 'strength' ? 'bg-lemon-500/10' : ex.type === 'cardio' ? 'bg-forest-500/10' : 'bg-purple-500/10'}`}>{ex.type}</span>
                      <span className="text-lemon-100/30">{ex.sets ? `${ex.sets}×${ex.reps}` : ex.duration_seconds ? `${ex.duration_seconds}s` : '—'}</span>
                    </div>
                  ))}
                  {!(t.exercises?.length) && <p className="text-xs text-lemon-100/25 italic">No exercises defined</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type ExForm = { name: string; type: 'strength'|'cardio'|'flexibility'; sets: string; reps: string; duration_seconds: string; rest_seconds: string }

function WorkoutForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm]       = useState({ name: '', tag: '', emoji: '💪', duration_minutes: '30', calories_burned: '200' })
  const [exercises, setExercises] = useState<ExForm[]>([{ name: '', type: 'strength', sets: '', reps: '', duration_seconds: '', rest_seconds: '' }])
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const ef = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [k]: e.target.value } : ex))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const exRows = exercises.filter(e => e.name.trim()).map((e, i) => ({
        name: e.name, type: e.type,
        sets: e.sets ? +e.sets : null, reps: e.reps || null,
        duration_seconds: e.duration_seconds ? +e.duration_seconds : null,
        rest_seconds: e.rest_seconds ? +e.rest_seconds : null,
        sort_order: i + 1,
      }))
      const res = await fetch('/api/admin/workouts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration_minutes: +form.duration_minutes, calories_burned: +form.calories_burned, exercises: exRows }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 animate-fade-in border-lemon-500/25">
      <p className="text-sm font-semibold text-lemon-200">New Workout Template</p>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2">
        <input value={form.emoji} onChange={f('emoji')} className="w-12 bg-bark-800 rounded-xl text-center text-xl border border-lemon-500/20 focus:border-lemon-400/50 outline-none p-2" />
        <input value={form.name} onChange={f('name')} placeholder="Workout name *" required
          className="flex-1 bg-bark-800 rounded-xl px-3 py-2 text-sm text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/20" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['tag','Tag (e.g. HIIT)'],['duration_minutes','Duration (min)'],['calories_burned','Calories burned']].map(([k,l]) => (
          <input key={k} value={form[k as keyof typeof form]} onChange={f(k)} placeholder={l}
            className="bg-bark-800 rounded-xl px-3 py-2 text-xs text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/25" />
        ))}
      </div>

      {/* Exercises */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-lemon-100/50">Exercises</p>
          <button type="button" onClick={() => setExercises(p => [...p, { name:'', type:'strength', sets:'', reps:'', duration_seconds:'', rest_seconds:'' }])}
            className="text-xs text-lemon-400 flex items-center gap-1 hover:text-lemon-300 transition-colors">
            <Plus size={11} /> Add row
          </button>
        </div>
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-6 gap-1.5 items-center">
              <input value={ex.name} onChange={ef(i,'name')} placeholder="Name" className="col-span-2 bg-bark-800 rounded-lg px-2 py-1.5 text-xs text-lemon-100 border border-lemon-500/15 focus:border-lemon-400/40 outline-none placeholder:text-lemon-100/20" />
              <select value={ex.type} onChange={ef(i,'type')} className="bg-bark-800 rounded-lg px-1 py-1.5 text-xs text-lemon-100 border border-lemon-500/15 outline-none">
                <option value="strength">str</option>
                <option value="cardio">cardio</option>
                <option value="flexibility">flex</option>
              </select>
              <input value={ex.sets} onChange={ef(i,'sets')} placeholder="sets" className="bg-bark-800 rounded-lg px-2 py-1.5 text-xs text-lemon-100 border border-lemon-500/15 focus:border-lemon-400/40 outline-none placeholder:text-lemon-100/20" />
              <input value={ex.reps} onChange={ef(i,'reps')} placeholder="reps" className="bg-bark-800 rounded-lg px-2 py-1.5 text-xs text-lemon-100 border border-lemon-500/15 focus:border-lemon-400/40 outline-none placeholder:text-lemon-100/20" />
              <button type="button" onClick={() => setExercises(p => p.filter((_,j) => j!==i))} className="text-lemon-100/25 hover:text-red-400 transition-colors flex items-center justify-center">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-lemon-500/20 text-sm text-lemon-100/50 hover:text-lemon-100/70 transition-all flex items-center justify-center gap-1">
          <X size={13} /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 rounded-xl bg-lemon-500/25 text-lemon-300 text-sm font-medium border border-lemon-500/30 hover:bg-lemon-500/35 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Create
        </button>
      </div>
    </form>
  )
}
