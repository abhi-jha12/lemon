/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/push.ts
 * Core server-side push sending utility using web-push + VAPID.
 * Only import this in server-side code (API routes, server components).
 */
import webpush from 'web-push'
import { createServerClient } from '@supabase/ssr'

// ── VAPID config ──────────────────────────────────────────────────────────────
// Call once at module load — safe because this only runs server-side.
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@lemon.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title:  string
  body:   string
  icon?:  string
  badge?: string
  url?:   string
  type?:  string   // for analytics / sw routing
  tag?:   string   // collapses duplicate notifications of same type
}

export interface SendResult {
  subscriptionId: string
  userId:         string
  ok:             boolean
  error?:         string
}

/**
 * Send a push notification to every subscription for a list of user IDs.
 * Automatically removes expired/invalid subscriptions from the DB.
 */
export async function sendPushToUsers(
  supabase: ReturnType<typeof createServerClient>,
  userIds: string[],
  payload: PushPayload
): Promise<SendResult[]> {
  if (!userIds.length) return []

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs?.length) return []

  const payloadStr = JSON.stringify({
    title:  payload.title,
    body:   payload.body,
    icon:   payload.icon  ?? '/icon-192.png',
    badge:  payload.badge ?? '/favicon-32.png',
    url:    payload.url   ?? '/',
    type:   payload.type  ?? 'manual',
    tag:    payload.tag   ?? payload.type ?? 'lemon',
  })

  const results = await Promise.allSettled(
    subs.map((sub: any) => 
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr
      ).then(() => ({ sub, ok: true, error: undefined }))
       .catch((err: Error & { statusCode?: number }) => ({
          sub,
          ok: false,
          error: err.message,
          // 410 Gone / 404 = subscription expired, should be deleted
          expired: err.statusCode === 410 || err.statusCode === 404,
        }))
    )
  )

  // Collect expired subscription IDs to clean up
  const expiredIds: string[] = []
  const sendResults: SendResult[] = []

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const { sub, ok, error, expired } = r.value as typeof r.value & { expired?: boolean }
    sendResults.push({ subscriptionId: sub.id, userId: sub.user_id, ok, error })
    if (expired) expiredIds.push(sub.id)
  }

  // Clean up expired subscriptions in the background
  if (expiredIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  // Log to notification_logs
  const logRows = sendResults.map(r => ({
    subscription_id: r.subscriptionId,
    user_id:         r.userId,
    title:           payload.title,
    body:            payload.body,
    type:            payload.type ?? 'manual',
    error:           r.error ?? null,
  }))
  await supabase.from('notification_logs').insert(logRows)

  return sendResults
}

/**
 * Send to ALL subscribed users.
 */
export async function sendPushToAll(
  supabase: ReturnType<typeof createServerClient>,
  payload: PushPayload
): Promise<SendResult[]> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id')
  const userIds = [...new Set((subs ?? []).map((s: any) => s.user_id))]
  return sendPushToUsers(supabase, userIds as string[], payload)
}
