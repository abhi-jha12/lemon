'use client'
/**
 * components/AdminNotifications.tsx
 *
 * Drop this as a tab inside app/admin/page.tsx alongside MealTemplatesAdmin
 * and WorkoutTemplatesAdmin.
 *
 * Features:
 * - Create scheduled notifications (broadcast or single user)
 * - Send immediate push (blast)
 * - View scheduled & sent history
 * - Cancel pending notifications
 */
import { useState, useEffect, useCallback } from 'react'
import { Bell, Send, Trash2, Clock, CheckCircle, Loader2, Plus, X, Users, User } from 'lucide-react'

interface ScheduledNotif {
  id:           string
  title:        string
  body:         string
  icon:         string
  url:          string
  target_type:  'all' | 'user'
  target_user:  string | null
  scheduled_at: string
  sent_at:      string | null
  sent_count:   number
  created_at:   string
}

interface UserOption { id: string; name: string; email: string }

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<ScheduledNotif[]>([])
  const [users, setUsers]                 = useState<UserOption[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [sendMode, setSendMode]           = useState<'schedule' | 'now'>('schedule')
  const [toast, setToast]                 = useState('')
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [sending, setSending]             = useState(false)

  // Form state
  const [form, setForm] = useState({
    title:       '',
    body:        '',
    url:         '/',
    target_type: 'all' as 'all' | 'user',
    target_user: '',
    scheduled_at: '',
  })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    const [nRes, uRes] = await Promise.all([
      fetch('/api/push/schedule'),
      fetch('/api/admin/users').catch(() => ({ ok: false })),
    ])
    const nData = await (nRes as Response).json()
    setNotifications(nData.notifications ?? [])
    if ((uRes as Response).ok) {
      const uData = await (uRes as Response).json()
      setUsers(uData.users ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      showToast('Title and message are required')
      return
    }
    if (sendMode === 'schedule' && !form.scheduled_at) {
      showToast('Please pick a schedule time')
      return
    }

    setSending(true)
    try {
      if (sendMode === 'now') {
        // Immediate blast
        const res = await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:       form.title,
            body:        form.body,
            url:         form.url,
            target_type: form.target_type,
            target_user: form.target_type === 'user' ? form.target_user : undefined,
          }),
        })
        const data = await res.json()
        showToast(`Sent to ${data.sent} device(s) ✓`)
      } else {
        // Schedule
        const res = await fetch('/api/push/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:       form.title,
            body:        form.body,
            url:         form.url,
            target_type: form.target_type,
            target_user: form.target_type === 'user' ? form.target_user : undefined,
            scheduled_at: new Date(form.scheduled_at).toISOString(),
          }),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
        showToast('Notification scheduled ✓')
        load()
      }
      setShowForm(false)
      setForm({ title: '', body: '', url: '/', target_type: 'all', target_user: '', scheduled_at: '' })
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const res = await fetch('/api/push/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { showToast('Cancelled'); load() }
    else { const d = await res.json(); showToast(d.error ?? 'Failed') }
    setDeleting(null)
  }

  // Quick template buttons
  const TEMPLATES = [
    { title: '🍋 Weekly check-in', body: "Hey! Don't forget to log today's meals and workout. You've got this!" },
    { title: '💪 Motivation boost', body: 'Every day is a new chance to crush your goals. Keep going!' },
    { title: '🏆 Week recap', body: "You've had a great week! Check your Lemon dashboard to see your progress." },
    { title: '🎯 Challenge reminder', body: "Don't let today slip away — log your workout and hit that water goal!" },
  ]

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-forest-700 text-lemon-200 text-sm px-4 py-2.5
                        rounded-xl border border-lemon-500/20 shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-lemon-200">Push notifications</h2>
          <p className="text-xs text-lemon-100/40 mt-0.5">Schedule or blast to all users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-medium text-bark-900
                     bg-lemon-400 hover:bg-lemon-300 px-3 py-2 rounded-xl transition-all"
        >
          <Plus size={13} /> New notification
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-lemon-500/20 overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="px-4 pt-4 pb-3 border-b border-lemon-500/10 flex items-center justify-between">
            <span className="text-sm font-medium text-lemon-200">Create notification</span>
            <button onClick={() => setShowForm(false)}><X size={14} className="text-lemon-100/40" /></button>
          </div>

          <div className="p-4 space-y-3">
            {/* Send mode toggle */}
            <div className="flex gap-2">
              {(['schedule', 'now'] as const).map(m => (
                <button key={m} onClick={() => setSendMode(m)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    sendMode === m
                      ? 'border-lemon-500/40 text-lemon-300 bg-lemon-500/15'
                      : 'border-lemon-500/15 text-lemon-100/40'}`}>
                  {m === 'schedule' ? <Clock size={11} /> : <Send size={11} />}
                  {m === 'schedule' ? 'Schedule' : 'Send now'}
                </button>
              ))}
            </div>

            {/* Templates */}
            <div>
              <p className="text-xs text-lemon-100/30 mb-2">Quick templates</p>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.title} onClick={() => setForm(f => ({ ...f, title: t.title, body: t.body }))}
                    className="text-left px-3 py-2 rounded-xl border border-lemon-500/15
                               hover:border-lemon-500/30 transition-all">
                    <p className="text-xs font-medium text-lemon-200 truncate">{t.title}</p>
                    <p className="text-xs text-lemon-100/30 truncate mt-0.5">{t.body.slice(0, 40)}…</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-lemon-100/40 mb-1 block">Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 💪 Time to move!"
                className="w-full bg-transparent border border-lemon-500/20 rounded-xl px-3 py-2
                           text-sm text-lemon-200 placeholder-lemon-100/25 outline-none
                           focus:border-lemon-500/50 transition-colors"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs text-lemon-100/40 mb-1 block">Message</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={2}
                placeholder="What do you want to say?"
                className="w-full bg-transparent border border-lemon-500/20 rounded-xl px-3 py-2
                           text-sm text-lemon-200 placeholder-lemon-100/25 outline-none
                           focus:border-lemon-500/50 transition-colors resize-none"
              />
            </div>

            {/* URL */}
            <div>
              <label className="text-xs text-lemon-100/40 mb-1 block">Deep link (tap destination)</label>
              <select
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full bg-bark-900 border border-lemon-500/20 rounded-xl px-3 py-2
                           text-sm text-lemon-200 outline-none focus:border-lemon-500/50"
              >
                <option value="/">Dashboard</option>
                <option value="/?tab=meals">Meals</option>
                <option value="/?tab=workout">Workout</option>
                <option value="/?tab=macros">Macros</option>
              </select>
            </div>

            {/* Target */}
            <div>
              <label className="text-xs text-lemon-100/40 mb-1 block">Send to</label>
              <div className="flex gap-2 mb-2">
                {(['all', 'user'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, target_type: t }))}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      form.target_type === t
                        ? 'border-lemon-500/40 text-lemon-300 bg-lemon-500/15'
                        : 'border-lemon-500/15 text-lemon-100/40'}`}>
                    {t === 'all' ? <Users size={11} /> : <User size={11} />}
                    {t === 'all' ? 'All users' : 'Specific user'}
                  </button>
                ))}
              </div>
              {form.target_type === 'user' && (
                <select
                  value={form.target_user}
                  onChange={e => setForm(f => ({ ...f, target_user: e.target.value }))}
                  className="w-full bg-bark-900 border border-lemon-500/20 rounded-xl px-3 py-2
                             text-sm text-lemon-200 outline-none focus:border-lemon-500/50"
                >
                  <option value="">Select a user…</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Schedule time */}
            {sendMode === 'schedule' && (
              <div>
                <label className="text-xs text-lemon-100/40 mb-1 block">Schedule at</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  className="w-full bg-bark-900 border border-lemon-500/20 rounded-xl px-3 py-2
                             text-sm text-lemon-200 outline-none focus:border-lemon-500/50
                             [color-scheme:dark]"
                />
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                         bg-lemon-400 hover:bg-lemon-300 text-bark-900 text-sm font-medium
                         transition-all disabled:opacity-50"
            >
              {sending
                ? <Loader2 size={14} className="animate-spin" />
                : sendMode === 'now' ? <Send size={14} /> : <Clock size={14} />}
              {sendMode === 'now' ? 'Send now' : 'Schedule notification'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="text-lemon-400 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10">
          <Bell size={28} className="text-lemon-100/20 mx-auto mb-2" />
          <p className="text-sm text-lemon-100/40">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id}
                 className="rounded-2xl border border-lemon-500/10 px-4 py-3 flex items-start gap-3"
                 style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                n.sent_at ? 'bg-green-500/15' : 'bg-lemon-500/15'}`}>
                {n.sent_at
                  ? <CheckCircle size={13} className="text-green-400" />
                  : <Clock       size={13} className="text-lemon-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-lemon-200 truncate">{n.title}</p>
                <p className="text-xs text-lemon-100/50 truncate mt-0.5">{n.body}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    n.target_type === 'all'
                      ? 'bg-lemon-500/10 text-lemon-300/70'
                      : 'bg-purple-500/15 text-purple-300/70'}`}>
                    {n.target_type === 'all' ? 'All users' : 'Single user'}
                  </span>
                  <span className="text-xs text-lemon-100/30">
                    {n.sent_at
                      ? `Sent ${new Date(n.sent_at).toLocaleString()} · ${n.sent_count} device(s)`
                      : `Scheduled ${new Date(n.scheduled_at).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {!n.sent_at && (
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={deleting === n.id}
                  className="text-lemon-100/20 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  {deleting === n.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
