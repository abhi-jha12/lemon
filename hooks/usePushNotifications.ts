'use client'
/**
 * hooks/usePushNotifications.ts
 *
 * Manages the full push notification subscription lifecycle:
 * - Checks browser support & permission state
 * - Subscribes / unsubscribes via /api/push/subscribe
 * - Persists subscription in localStorage so we know if this device is subscribed
 */
import { useState, useEffect, useCallback } from 'react'

const LS_KEY = 'lemon_push_endpoint'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const arr = Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission]     = useState<PushPermission>('default')
  const [subscribed, setSubscribed]     = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Detect support and current state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PushPermission)

    // Check if we already have an active subscription on this device
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
      const reg = await navigator.serviceWorker.ready

      // Request permission if not yet granted
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

  return { permission, subscribed, loading, error, subscribe, unsubscribe }
}
