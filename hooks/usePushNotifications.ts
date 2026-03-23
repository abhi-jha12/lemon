'use client'
import { useState, useEffect, useCallback } from 'react'

const LS_KEY = 'lemon_push_endpoint'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const arr = Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}

// ── iOS detection helpers ───────────────────────────────────────────────────

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// Returns true only when running as an installed PWA (standalone / fullscreen).
// On iOS, push notifications are ONLY available in this mode.
function isInstalledPwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

// iOS 16.4+ added web push support. Anything older = truly unsupported.
function isIosPushSupported(): boolean {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/)
  if (!match) return false
  const major = parseInt(match[1], 10)
  const minor = parseInt(match[2], 10)
  return major > 16 || (major === 16 && minor >= 4)
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

// Extra iOS-specific state so the UI can show the right prompt
export type IosState =
  | 'ok'               // installed PWA on iOS 16.4+ — fully supported
  | 'needs_install'    // on iOS but not installed as PWA yet
  | 'ios_too_old'      // iOS < 16.4
  | 'not_ios'          // non-iOS device

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [iosState, setIosState]     = useState<IosState>('not_ios')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ── iOS checks first ───────────────────────────────────────────────────
    if (isIos()) {
      if (!isIosPushSupported()) {
        setIosState('ios_too_old')
        setPermission('unsupported')
        return
      }
      if (!isInstalledPwa()) {
        // Capable device but not installed — show install prompt instead
        setIosState('needs_install')
        setPermission('unsupported')   // treat as unsupported until installed
        return
      }
      setIosState('ok')
    } else {
      setIosState('not_ios')
    }

    // ── Standard support check ─────────────────────────────────────────────
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PushPermission)

    const savedEndpoint = localStorage.getItem(LS_KEY)
    if (savedEndpoint) {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub && sub.endpoint === savedEndpoint)
        })
      )
    }
  }, [])

  const subscribe = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Guard: on iOS, must be installed PWA
      if (isIos() && !isInstalledPwa()) {
        setError('Please add Lemon to your Home Screen first, then enable notifications.')
        return
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setError('Push notifications are not supported in this browser.')
        return
      }

      const reg = await navigator.serviceWorker.ready

      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission()
        setPermission(result as PushPermission)
        if (result !== 'granted') {
          setError('Notification permission denied.')
          return
        }
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription: sub.toJSON() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save subscription')
      }

      localStorage.setItem(LS_KEY, sub.endpoint)
      setSubscribed(true)
      setPermission('granted')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Subscription failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      localStorage.removeItem(LS_KEY)
      setSubscribed(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unsubscribe failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { permission, subscribed, loading, error, iosState, subscribe, unsubscribe }
}