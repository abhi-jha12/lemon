'use client'
import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — you could show a toast here
              console.log('[Lemon] New version available. Refresh to update.')
            }
          })
        })

        console.log('[Lemon] Service worker registered ✓', reg.scope)
      } catch (err) {
        console.warn('[Lemon] SW registration failed:', err)
      }
    }

    // Delay slightly so it doesn't block first paint
    window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
