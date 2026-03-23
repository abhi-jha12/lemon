'use client'
import { useState, useEffect, useCallback } from 'react'

const LS_KEY = 'lemon_push_endpoint'

// ── Matches the working implementation exactly ─────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ── User agent helpers (ported from working useUserAgent hook) ─────────────
function getUAInfo(): { isIOS: boolean; isStandalone: boolean; notificationsSupported: boolean } {
  if (typeof window === 'undefined') {
    return { isIOS: false, isStandalone: false, notificationsSupported: false }
  }
  const ua = window.navigator.userAgent

  // Covers Safari, Chrome (CriOS), Firefox (FxiOS), Edge, DuckDuckGo etc. on iOS
  const isIOS = !!ua.match(/iPhone|iPad|iPod/i)

  // Apple forces all iOS browsers to use WebKit, so display-mode: standalone
  // is the only reliable signal across Safari, Chrome (CriOS), Firefox (FxiOS).
  // navigator.standalone is a Safari-only fallback for older iOS versions.
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

  const notificationsSupported =
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  return { isIOS, isStandalone, notificationsSupported }
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'
export type IosState = 'ok' | 'needs_install' | 'ios_too_old' | 'not_ios'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [iosState, setIosState]     = useState<IosState>('not_ios')

  useEffect(() => {
    const { isIOS, isStandalone, notificationsSupported } = getUAInfo()

    if (isIOS) {
      if (!isStandalone) {
        setIosState('needs_install')
        setPermission('unsupported')
        return
      }
      setIosState('ok')
    } else {
      setIosState('not_ios')
    }

    if (!notificationsSupported) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PushPermission)

    // Check if this device is already subscribed
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
      const { isIOS, isStandalone, notificationsSupported } = getUAInfo()

      if (isIOS && !isStandalone) {
        setError('Please add Lemon to your Home Screen first, then enable notifications.')
        return
      }

      if (!notificationsSupported) {
        setError('Push notifications are not supported in this browser.')
        return
      }

      // Request permission first
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        setPermission(result as PushPermission)
        if (result !== 'granted') {
          setError('Notification permission denied.')
          return
        }
      }

      if (Notification.permission !== 'granted') {
        setError('Please enable notifications in your browser settings.')
        return
      }

      // Register SW and call update() before ready — required for iOS
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await reg.update()
      const readyReg = await navigator.serviceWorker.ready

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')

      const convertedKey = urlBase64ToUint8Array(publicKey)

      const sub = await readyReg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: convertedKey.buffer as ArrayBuffer,
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