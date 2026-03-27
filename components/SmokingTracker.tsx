'use client'
import { useState } from 'react'
import {
  Cigarette, ShieldCheck, TrendingDown, DollarSign,
  Clock, Flame, Plus, X, Loader2, Settings, Check,
} from 'lucide-react'
import { useUserSettings, useSmokingToday, useSmokingHistory } from '@/hooks/useData'
import type { SmokingLog } from '@/types'

const RECOVERY_MILESTONES = [
  { minutes: 20,    label: '20 min',    fact: 'Heart rate drops to normal' },
  { minutes: 480,   label: '8 hours',   fact: 'Nicotine level halved, oxygen normalises' },
  { minutes: 1440,  label: '24 hours',  fact: 'Heart attack risk starts to fall' },
  { minutes: 2880,  label: '48 hours',  fact: 'Nerve endings begin regrowing' },
  { minutes: 10080, label: '1 week',    fact: 'Circulation and lung function improving' },
  { minutes: 43200, label: '1 month',   fact: 'Coughs and fatigue greatly reduced' },
]

function formatTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h === 0) return `${m}m ago`
  if (h < 24) return `${h}h ${m}m ago`
  return `${Math.floor(h / 24)}d ${h % 24}h ago`
}

function formatStreak(quitDate: string | null, lastSmoked: SmokingLog | null): { days: number; hours: number; minutes: number } {
  const base = lastSmoked
    ? new Date(lastSmoked.logged_at)
    : quitDate ? new Date(quitDate) : null
  if (!base) return { days: 0, hours: 0, minutes: 0 }
  const diff = Date.now() - base.getTime()
  const totalMinutes = Math.floor(diff / 60000)
  return {
    days:    Math.floor(totalMinutes / 1440),
    hours:   Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  }
}

export default function SmokingTracker() {
  const { settings: rawSettings, loading: sLoading, save: saveSettings } = useUserSettings()

  // Remap user_settings smoking fields to the shape the component expects
  const settings = rawSettings ? {
    quit_date:                    rawSettings.smoking_quit_date ?? null,
    cigarettes_per_day_baseline:  rawSettings.cigarettes_per_day_baseline ?? 10,
    pack_price_inr:               rawSettings.pack_price_inr ?? 250,
    cigarettes_per_pack:          rawSettings.cigarettes_per_pack ?? 20,
  } : null
  const { logs, smokedToday, resistedToday, loading: lLoading, logSmoked, logCravingResisted, deleteLog } = useSmokingToday()
  const { data: history } = useSmokingHistory(30)

  const [showSettings, setShowSettings] = useState(false)
  const [showNote, setShowNote]         = useState(false)
  const [noteType, setNoteType]         = useState<'smoked' | 'craving_resisted'>('smoked')
  const [note, setNote]                 = useState('')
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState<string | null>(null)

  // Settings form
  const [formQuit,     setFormQuit]     = useState(settings?.quit_date ?? '')
  const [formBaseline, setFormBaseline] = useState(String(settings?.cigarettes_per_day_baseline ?? 10))
  const [formPrice,    setFormPrice]    = useState(String(settings?.pack_price_inr ?? 250))
  const [formPerPack,  setFormPerPack]  = useState(String(settings?.cigarettes_per_pack ?? 20))
  const [settingsSaving, setSettingsSaving] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const lastSmoked = [...logs].reverse().find(l => l.type === 'smoked') ?? null
  const streak     = formatStreak(settings?.quit_date ?? null, lastSmoked)
  const streakMins = streak.days * 1440 + streak.hours * 60 + streak.minutes

  // Money saved since quit date
  const moneySaved = (() => {
    if (!settings) return null
    const base     = settings.quit_date ? new Date(settings.quit_date) : null
    if (!base) return null
    const daysSince = (Date.now() - base.getTime()) / 86400000
    const cigsAvoided = Math.max(0, daysSince * settings.cigarettes_per_day_baseline - smokedToday)
    const pricePerCig = settings.pack_price_inr / settings.cigarettes_per_pack
    return Math.round(cigsAvoided * pricePerCig)
  })()

  // 30-day chart data (cigarettes smoked per day)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const smoked = (history ?? []).filter(l => l.date === dateStr && l.type === 'smoked').length
    const resisted = (history ?? []).filter(l => l.date === dateStr && l.type === 'craving_resisted').length
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2), smoked, resisted }
  })
  const maxBar = Math.max(...last7.map(d => d.smoked), settings?.cigarettes_per_day_baseline ?? 10, 1)

  const handleLog = async () => {
    setSaving(true)
    try {
      if (noteType === 'smoked') {
        await logSmoked(note || undefined)
        showToast('Logged — be kind to yourself')
      } else {
        await logCravingResisted(note || undefined)
        showToast('Craving resisted! 💪')
      }
      setNote(''); setShowNote(false)
    } catch { showToast('Could not save') }
    finally { setSaving(false) }
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      await saveSettings({
        smoking_quit_date: formQuit || null,
        cigarettes_per_day_baseline: Math.max(1, parseInt(formBaseline) || 10),
        pack_price_inr: Math.max(1, parseFloat(formPrice) || 250),
        cigarettes_per_pack: Math.max(1, parseInt(formPerPack) || 20),
      })
      showToast('Settings saved')
      setShowSettings(false)
    } catch { showToast('Could not save settings') }
    finally { setSettingsSaving(false) }
  }

  if (sLoading || lLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-lemon-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Streak banner */}
      <div className="card p-4 lemon-glow">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-lemon-100/50 font-medium">Time smoke-free</p>
          <button onClick={() => setShowSettings(!showSettings)} className="text-lemon-100/30 hover:text-lemon-300 transition-colors">
            <Settings size={14} />
          </button>
        </div>

        {streakMins > 0 ? (
          <div className="flex gap-4">
            {[
              { val: streak.days,    unit: 'days' },
              { val: streak.hours,   unit: 'hrs' },
              { val: streak.minutes, unit: 'min' },
            ].map(({ val, unit }) => (
              <div key={unit} className="text-center">
                <p className="font-display text-2xl font-bold text-lemon-300">{val}</p>
                <p className="text-xs text-lemon-100/40">{unit}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-lemon-100/50">Set your quit date in settings to track your streak</p>
        )}

        {/* Recovery milestones */}
        {streakMins > 0 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {RECOVERY_MILESTONES.map(m => {
              const reached = streakMins >= m.minutes
              return (
                <div key={m.minutes}
                  title={m.fact}
                  className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                    reached
                      ? 'bg-forest-800/60 border border-forest-500/40 text-forest-300'
                      : 'border border-lemon-100/10 text-lemon-100/20'
                  }`}>
                  {reached ? '✓' : '○'} {m.label}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card p-4 animate-fade-in space-y-3">
          <p className="text-sm font-semibold text-lemon-200">Smoking settings</p>
          <div className="space-y-2">
            {[
              { label: 'Quit date', type: 'date', val: formQuit, set: setFormQuit },
            ].map(({ label, type, val, set }) => (
              <div key={label}>
                <p className="text-xs text-lemon-100/40 mb-1">{label}</p>
                <input type={type} value={val} onChange={e => set(e.target.value)}
                  className="w-full bg-bark-700 border border-lemon-500/20 rounded-lg px-3 py-2 text-sm text-lemon-200 focus:outline-none focus:border-lemon-500/60"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Cigarettes/day', val: formBaseline, set: setFormBaseline },
                { label: 'Pack price (₹)', val: formPrice, set: setFormPrice },
                { label: 'Per pack', val: formPerPack, set: setFormPerPack },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <p className="text-xs text-lemon-100/40 mb-1">{label}</p>
                  <input type="number" value={val} onChange={e => set(e.target.value)}
                    className="w-full bg-bark-700 border border-lemon-500/20 rounded-lg px-2 py-2 text-sm text-lemon-200 focus:outline-none focus:border-lemon-500/60"
                  />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSaveSettings} disabled={settingsSaving}
            className="w-full py-2 rounded-xl bg-lemon-500/20 border border-lemon-500/40 text-lemon-300 text-sm font-medium flex items-center justify-center gap-2">
            {settingsSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save settings
          </button>
        </div>
      )}

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <Cigarette size={16} className="text-red-400 mx-auto mb-1.5" />
          <p className="font-display text-xl font-bold text-red-400">{smokedToday}</p>
          <p className="text-xs text-lemon-100/40">today</p>
        </div>
        <div className="card p-3 text-center">
          <ShieldCheck size={16} className="text-forest-400 mx-auto mb-1.5" />
          <p className="font-display text-xl font-bold text-forest-400">{resistedToday}</p>
          <p className="text-xs text-lemon-100/40">resisted</p>
        </div>
        <div className="card p-3 text-center">
          <DollarSign size={16} className="text-lemon-400 mx-auto mb-1.5" />
          <p className="font-display text-xl font-bold text-lemon-400">
            {moneySaved !== null ? `₹${moneySaved}` : '—'}
          </p>
          <p className="text-xs text-lemon-100/40">saved</p>
        </div>
      </div>

      {/* Quick log buttons */}
      <div className="card p-4 space-y-3">
        <p className="text-sm font-semibold text-lemon-200">Log now</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setNoteType('smoked'); setShowNote(true) }}
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Cigarette size={20} />
            <span className="text-xs font-medium">I smoked</span>
          </button>
          <button
            onClick={() => { setNoteType('craving_resisted'); setShowNote(true) }}
            className="flex flex-col items-center gap-2 py-4 rounded-xl border border-forest-500/30 bg-forest-500/10 text-forest-400 hover:bg-forest-500/20 transition-all"
          >
            <ShieldCheck size={20} />
            <span className="text-xs font-medium">Resisted craving</span>
          </button>
        </div>

        {showNote && (
          <div className="space-y-2 animate-fade-in">
            <input
              type="text"
              placeholder={noteType === 'smoked' ? 'What triggered it? (optional)' : 'What helped? (optional)'}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-bark-700 border border-lemon-500/20 rounded-lg px-3 py-2 text-sm text-lemon-200 placeholder-lemon-100/20 focus:outline-none focus:border-lemon-500/60"
            />
            <div className="flex gap-2">
              <button onClick={handleLog} disabled={saving}
                className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                  noteType === 'smoked'
                    ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                    : 'bg-forest-500/20 border border-forest-500/40 text-forest-300'
                }`}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save
              </button>
              <button onClick={() => { setShowNote(false); setNote('') }}
                className="px-4 py-2 rounded-xl border border-lemon-100/10 text-lemon-100/40 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7-day bar chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-lemon-200">Last 7 days</p>
          <div className="flex items-center gap-3 text-xs text-lemon-100/40">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" /> smoked</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-forest-500/60 inline-block" /> resisted</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-1.5" style={{ height: 80 }}>
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: 60 }}>
                {d.resisted > 0 && (
                  <div
                    className="w-full rounded-sm bg-forest-500/50"
                    style={{ height: `${Math.round((d.resisted / maxBar) * 60)}px`, minHeight: 3 }}
                  />
                )}
                {d.smoked > 0 && (
                  <div
                    className="w-full rounded-sm bg-red-500/60"
                    style={{ height: `${Math.round((d.smoked / maxBar) * 60)}px`, minHeight: 3 }}
                  />
                )}
                {d.smoked === 0 && d.resisted === 0 && (
                  <div className="w-full rounded-sm bg-bark-600/40" style={{ height: 3 }} />
                )}
              </div>
              <span className="text-xs text-lemon-100/30">{d.label}</span>
            </div>
          ))}
        </div>
        {settings?.cigarettes_per_day_baseline && (
          <p className="text-xs text-lemon-100/30 mt-2 text-right">
            Baseline: {settings.cigarettes_per_day_baseline}/day
          </p>
        )}
      </div>

      {/* Today's log */}
      {logs.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-lemon-200 mb-3">Today's log</p>
          <div className="space-y-2">
            {[...logs].reverse().map(log => (
              <div key={log.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  log.type === 'smoked' ? 'bg-red-500/15' : 'bg-forest-500/15'
                }`}>
                  {log.type === 'smoked'
                    ? <Cigarette size={13} className="text-red-400" />
                    : <ShieldCheck size={13} className="text-forest-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${log.type === 'smoked' ? 'text-red-400' : 'text-forest-400'}`}>
                    {log.type === 'smoked' ? 'Smoked' : 'Resisted craving'}
                  </p>
                  {log.note && <p className="text-xs text-lemon-100/40 truncate">{log.note}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-lemon-100/30">{formatTimeSince(log.logged_at)}</span>
                  <button onClick={() => deleteLog(log.id)} className="text-lemon-100/20 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery facts */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">Recovery timeline</p>
        <div className="space-y-2">
          {RECOVERY_MILESTONES.map(m => {
            const reached = streakMins >= m.minutes
            return (
              <div key={m.minutes} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                reached ? 'bg-forest-800/40 border border-forest-600/20' : 'opacity-40'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  reached ? 'bg-forest-500/30 border border-forest-400/60' : 'border border-lemon-100/20'
                }`}>
                  {reached && <Check size={10} className="text-forest-400" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-lemon-200">{m.label}</p>
                  <p className="text-xs text-lemon-100/50">{m.fact}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
