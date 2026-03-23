/**
 * GET /api/push/cron
 *
 * This endpoint should be called every minute by a cron service
 * (Vercel Cron, GitHub Actions, cron-job.org, etc.)
 *
 * It does two things:
 *  1. Sends any admin-scheduled notifications that are due.
 *  2. Fires automatic reminder notifications to subscribed users
 *     based on time-of-day heuristics (meal, workout, water reminders).
 *
 * Protect it with a CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendPushToUsers, sendPushToAll, type PushPayload } from '@/lib/push'

function makeSupabase() {
  // Server-only, no cookies needed for this route
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// ── Motivational messages ─────────────────────────────────────────────────────
const MOTIVATION = [
  { title: '🌟 Keep going!', body: "Every rep, every bite logged — you're building a habit. Check in today." },
  { title: '💪 Strong choice ahead', body: 'Your future self will thank you for logging today. Open Lemon.' },
  { title: '🍋 Squeeze the day', body: "Small consistent actions lead to big changes. Log today's meals." },
  { title: '🏆 Champion mindset', body: 'Champions show up even when motivation is low. Log your workout!' },
  { title: '🌱 Growth mode', body: "You're making progress — even if you can't see it yet. Stay consistent." },
]

// ── Reminder message pools ────────────────────────────────────────────────────
const MEAL_REMINDERS = [
  { title: '🍽️ Breakfast time?', body: "Don't skip it — log your breakfast to start the day right.", url: '/?tab=meals', tag: 'reminder_meal' },
  { title: '☀️ Lunch check-in', body: 'Midday fuel matters. Log your lunch on Lemon!', url: '/?tab=meals', tag: 'reminder_meal' },
  { title: '🌙 Dinner reminder', body: 'Wrap up your day right — log dinner and hit your macros.', url: '/?tab=meals', tag: 'reminder_meal' },
  { title: '🥪 Snack logged?', body: 'Every bite counts. Log your snack to stay on track.', url: '/?tab=meals', tag: 'reminder_meal' },
]

const WORKOUT_REMINDERS = [
  { title: '🏃 Move your body', body: 'A quick workout goes a long way. Log it on Lemon!', url: '/?tab=workout', tag: 'reminder_workout' },
  { title: '💪 Workout time!', body: "You've got this — open Lemon and start your session.", url: '/?tab=workout', tag: 'reminder_workout' },
  { title: '🔥 Burn it up', body: "No better time than now. Let's log a workout.", url: '/?tab=workout', tag: 'reminder_workout' },
]

const WATER_REMINDERS = [
  { title: '💧 Hydration check', body: 'Have you had enough water today? Log it on Lemon.', url: '/?tab=dashboard', tag: 'reminder_water' },
  { title: '🫗 Stay hydrated', body: 'A glass of water now keeps the headaches away. Log on Lemon!', url: '/?tab=dashboard', tag: 'reminder_water' },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = makeSupabase()
  const now      = new Date()
  const hour     = now.getUTCHours()   // adjust for your timezone offset as needed
  const results: Record<string, unknown> = {}

  // ── 1. Process admin-scheduled notifications ─────────────────────────────
  const { data: dueNotifs } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .is('sent_at', null)
    .lte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20)

  let scheduledSent = 0
  for (const notif of (dueNotifs ?? [])) {
    const payload: PushPayload = {
      title: notif.title,
      body:  notif.body,
      icon:  notif.icon,
      url:   notif.url,
      type:  'manual',
      tag:   'lemon-admin',
    }

    let sendResults=[]
    if (notif.target_type === 'all') {
      sendResults = await sendPushToAll(supabase, payload)
    } else if (notif.target_type === 'user' && notif.target_user) {
      sendResults = await sendPushToUsers(supabase, [notif.target_user], payload)
    }

    // Mark as sent
    await supabase
      .from('scheduled_notifications')
      .update({ sent_at: now.toISOString(), sent_count: sendResults?.length ?? 0 })
      .eq('id', notif.id)

    scheduledSent++
  }
  results.scheduledNotificationsSent = scheduledSent

  // ── 2. Auto-reminders (time-based, UTC hours) ─────────────────────────────
  // Adjust these UTC offsets to match your target timezone.
  // For IST (UTC+5:30): breakfast=2 (7:30am IST), lunch=6 (11:30am IST),
  // dinner=13 (6:30pm IST), workout=15 (8:30pm IST), water=[6,10,14], motivation=4

  const remindersSent: string[] = []

  // Get all subscribed user IDs
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id')
  const allUserIds = [...new Set((subs ?? []).map(s => s.user_id as string))]
  if (!allUserIds.length) {
    results.reminders = []
    return NextResponse.json(results)
  }

  // Breakfast reminder: 7:30am IST = 02:00 UTC
  if (hour === 2) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(0, 1)),
      type: 'reminder_meal',
    })
    remindersSent.push('breakfast')
  }

  // Lunch reminder: 12:30pm IST = 07:00 UTC
  if (hour === 7) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(1, 2)),
      type: 'reminder_meal',
    })
    remindersSent.push('lunch')
  }

  // Snack reminder: 4pm IST = 10:30 UTC
  if (hour === 10) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(3)),
      type: 'reminder_meal',
    })
    remindersSent.push('snack')
  }

  // Dinner reminder: 7:30pm IST = 14:00 UTC
  if (hour === 14) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(2, 3)),
      type: 'reminder_meal',
    })
    remindersSent.push('dinner')
  }

  // Workout reminder: 6:30am IST = 01:00 UTC  OR  6:30pm IST = 13:00 UTC
  if (hour === 1 || hour === 13) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(WORKOUT_REMINDERS),
      type: 'reminder_workout',
    })
    remindersSent.push('workout')
  }

  // Water reminders: 10am / 2pm / 6pm IST = 04:30 / 08:30 / 12:30 UTC
  if (hour === 4 || hour === 8 || hour === 12) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(WATER_REMINDERS),
      type: 'reminder_water',
    })
    remindersSent.push('water')
  }

  // Motivation: Tuesday & Thursday 8am IST = Wednesday/Friday 02:30 UTC
  // Simple heuristic: fire on UTC day 2 or 4 at hour 2
  const day = now.getUTCDay() // 0=Sun .. 6=Sat
  if ((day === 2 || day === 4) && hour === 2) {
    const m = pick(MOTIVATION)
    await sendPushToAll(supabase, { ...m, type: 'motivation', tag: 'motivation', url: '/' })
    remindersSent.push('motivation')
  }

  results.reminders = remindersSent
  return NextResponse.json(results)
}
