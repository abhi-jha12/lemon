'use client'
/**
 * components/NotificationSettings.tsx
 *
 * A card that lets users enable/disable push notifications for this device.
 * Drop it anywhere — Dashboard, Header dropdown, Settings page, etc.
 */
import { Bell, BellOff, BellRing, Loader2, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationSettings() {
  const { permission, subscribed, loading, error, subscribe, unsubscribe } =
    usePushNotifications()

  if (permission === 'unsupported') return null

  return (
    <div className="rounded-2xl border border-lemon-500/15 overflow-hidden"
         style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            subscribed ? 'bg-lemon-500/20' : 'bg-lemon-500/10'}`}>
            {subscribed
              ? <BellRing size={17} className="text-lemon-400" />
              : <Bell     size={17} className="text-lemon-100/40" />}
          </div>
          <div>
            <p className="text-sm font-medium text-lemon-200">Push notifications</p>
            <p className="text-xs text-lemon-100/40">
              {permission === 'denied'
                ? 'Blocked in browser settings'
                : subscribed
                  ? 'Reminders & motivation enabled'
                  : 'Get meal, workout & water reminders'}
            </p>
          </div>
        </div>

        {permission === 'denied' ? (
          <span className="text-xs text-red-400/70 bg-red-500/10 px-2 py-1 rounded-lg">
            Blocked
          </span>
        ) : loading ? (
          <Loader2 size={16} className="text-lemon-400 animate-spin" />
        ) : subscribed ? (
          <button
            onClick={unsubscribe}
            className="flex items-center gap-1.5 text-xs text-lemon-100/40 hover:text-red-400
                       px-3 py-1.5 rounded-xl border border-lemon-500/15 hover:border-red-500/30
                       transition-all"
          >
            <BellOff size={12} /> Turn off
          </button>
        ) : (
          <button
            onClick={subscribe}
            className="flex items-center gap-1.5 text-xs text-lemon-300 font-medium
                       px-3 py-1.5 rounded-xl border border-lemon-500/30 hover:border-lemon-500/60
                       bg-lemon-500/10 hover:bg-lemon-500/20 transition-all"
          >
            <Bell size={12} /> Enable
          </button>
        )}
      </div>

      {/* What you'll get */}
      {!subscribed && permission !== 'denied' && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {[
            { emoji: '🍽️', label: 'Meal reminders' },
            { emoji: '💪', label: 'Workout nudges' },
            { emoji: '💧', label: 'Water check-ins' },
          ].map(item => (
            <div key={item.label}
                 className="flex flex-col items-center gap-1 py-2 rounded-xl bg-lemon-500/5
                            border border-lemon-500/10 text-center">
              <span className="text-base">{item.emoji}</span>
              <span className="text-xs text-lemon-100/40 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10
                        px-3 py-2 rounded-xl border border-red-500/20">
          <X size={12} className="flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
