/**
 * GET /api/push/cron
 *
 * This endpoint should be called every 30 minutes by a cron service
 * (Vercel Cron, GitHub Actions, cron-job.org, etc.)
 *
 * It does two things:
 *  1. Sends any admin-scheduled notifications that are due.
 *  2. Fires automatic reminder notifications to subscribed users
 *     based on time-of-day heuristics (meal, workout, water reminders).
 *
 * Protect it with a CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendPushToUsers, sendPushToAll, type PushPayload } from "@/lib/push";

function makeSupabase() {
  // Server-only, no cookies needed for this route
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

// ── Motivational messages ─────────────────────────────────────────────────────
const MOTIVATION = [
  {
    title: "🌟 Keep going!",
    body: "Every rep, every bite logged — you're building a habit. Check in today.",
  },
  {
    title: "💪 Strong choice ahead",
    body: "Your future self will thank you for logging today. Open Lemon.",
  },
  {
    title: "🍋 Squeeze the day",
    body: "Small consistent actions lead to big changes. Log today's meals.",
  },
  {
    title: "🏆 Champion mindset",
    body: "Champions show up even when motivation is low. Log your workout!",
  },
  {
    title: "🌱 Growth mode",
    body: "You're making progress — even if you can't see it yet. Stay consistent.",
  },
];

// ── Reminder message pools ────────────────────────────────────────────────────
const MEAL_REMINDERS = [
  {
    title: "🍽️ Breakfast time?",
    body: "Don't skip it — log your breakfast to start the day right.",
    url: "/?tab=meals",
    tag: "reminder_meal",
  },
  {
    title: "☀️ Lunch check-in",
    body: "Midday fuel matters. Log your lunch on Lemon!",
    url: "/?tab=meals",
    tag: "reminder_meal",
  },
  {
    title: "🌙 Dinner reminder",
    body: "Wrap up your day right — log dinner and hit your macros.",
    url: "/?tab=meals",
    tag: "reminder_meal",
  },
  {
    title: "🥪 Snack logged?",
    body: "Every bite counts. Log your snack to stay on track.",
    url: "/?tab=meals",
    tag: "reminder_meal",
  },
];

const WORKOUT_REMINDERS = [
  {
    title: "🏃 Move your body",
    body: "A quick workout goes a long way. Log it on Lemon!",
    url: "/?tab=workout",
    tag: "reminder_workout",
  },
  {
    title: "💪 Workout time!",
    body: "You've got this — open Lemon and start your session.",
    url: "/?tab=workout",
    tag: "reminder_workout",
  },
  {
    title: "🔥 Burn it up",
    body: "No better time than now. Let's log a workout.",
    url: "/?tab=workout",
    tag: "reminder_workout",
  },
];

const WATER_REMINDERS = [
  {
    title: "💧 Hydration check",
    body: "Have you had enough water today? Log it on Lemon.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Stay hydrated",
    body: "A glass of water now keeps the headaches away. Log on Lemon!",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 Paani pi le yaar",
    body: "Kitni der se screen pe ho. Ek glass paani abhi pee lo!",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Bhai, hydrated reh",
    body: "Body ka 60% paani hai — usse maintain kar. Log kar Lemon pe.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 Water o'clock!",
    body: "Your body just sent a memo — it needs water. Don't leave it on read.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Thoda paani toh banta hai",
    body: "Din mein busy ho, samajh aata hai. Par ek glass toh pi lo abhi.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 Sip sip hooray!",
    body: "Halfway through the day — halfway to your water goal? Log on Lemon.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Dehydration incoming?",
    body: "Headache aane se pehle paani pi le. Serious baat hai yaar.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 Your plants get watered. Do you?",
    body: "Time to drink up. Log your water intake on Lemon.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Ek kaam kar",
    body: "Jo bhi kar raha hai, ruk. Paani pi. Phir chal.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 H₂O calling",
    body: "Your body is literally 60% water. Keep it that way — log on Lemon.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Paani = energy bhai",
    body: "Thaka hua feel ho raha hai? Chances are tu dehydrated hai. Pi le.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 Hydration squad checking in",
    body: "We don't skip water here. Log your intake and keep the streak alive.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Tera body tera yaar",
    body: "Uski sun — paani maang raha hai. Ek glass abhi, log baad mein.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "💧 No cap, drink water",
    body: "Skin glowing, energy high, focus on point — sab paani se hoga.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
  {
    title: "🫗 Last reminder for a while!",
    body: "Next one comes later — abhi ek glass pi le toh set ho ja.",
    url: "/?tab=dashboard",
    tag: "reminder_water",
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Water reminders fire every 1.5 hours across waking hours (IST).
 * Cron runs every 30 min, so only :00 and :30 UTC ticks are available.
 * 1.5-hour spacing = every 3rd tick.
 *
 * IST        UTC (h, m)
 * 07:00  →   01:30
 * 08:30  →   03:00
 * 10:00  →   04:30
 * 11:30  →   06:00
 * 13:00  →   07:30
 * 14:30  →   09:00
 * 16:00  →   10:30
 * 17:30  →   12:00
 * 19:00  →   13:30
 * 20:30  →   15:00
 * 22:00  →   16:30
 */
const WATER_SLOTS_UTC: Array<[number, number]> = [
  [1, 30],
  [3, 0],
  [4, 30],
  [6, 0],
  [7, 30],
  [9, 0],
  [10, 30],
  [12, 0],
  [13, 30],
  [15, 0],
  [16, 30],
];

/**
 * Motivation fires on Sun (0), Mon (1), Wed (3), Thu (4)
 * at 08:00 AM IST = 02:30 UTC
 */
const MOTIVATION_DAYS_UTC = new Set([0, 1, 3, 4]); // Sun, Mon, Wed, Thu

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const secret =
    req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = makeSupabase();
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const results: Record<string, unknown> = {};

  // ── 1. Process admin-scheduled notifications ─────────────────────────────
  const { data: dueNotifs } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .is("sent_at", null)
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  let scheduledSent = 0;
  for (const notif of dueNotifs ?? []) {
    const payload: PushPayload = {
      title: notif.title,
      body: notif.body,
      icon: notif.icon,
      url: notif.url,
      type: "manual",
      tag: "lemon-admin",
    };

    let sendResults = [];
    if (notif.target_type === "all") {
      sendResults = await sendPushToAll(supabase, payload);
    } else if (notif.target_type === "user" && notif.target_user) {
      sendResults = await sendPushToUsers(
        supabase,
        [notif.target_user],
        payload,
      );
    }

    // Mark as sent
    await supabase
      .from("scheduled_notifications")
      .update({
        sent_at: now.toISOString(),
        sent_count: sendResults?.length ?? 0,
      })
      .eq("id", notif.id);

    scheduledSent++;
  }
  results.scheduledNotificationsSent = scheduledSent;

  // ── 2. Auto-reminders (time-based, UTC hours) ─────────────────────────────
  const remindersSent: string[] = [];

  // Get all subscribed user IDs
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id");
  const allUserIds = [...new Set((subs ?? []).map((s) => s.user_id as string))];
  if (!allUserIds.length) {
    results.reminders = [];
    return NextResponse.json(results);
  }

  // ── Meal reminders (IST times, fired at :00 of the UTC hour) ──────────────

  // Breakfast: 10:30am IST = 05:00 UTC
  if (hour === 5 && minute === 0) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(0, 1)),
      type: "reminder_meal",
    });
    remindersSent.push("breakfast");
  }

  // Lunch: 1:30pm IST = 08:00 UTC
  if (hour === 8 && minute === 0) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(1, 2)),
      type: "reminder_meal",
    });
    remindersSent.push("lunch");
  }

  // Snack: 5:00pm IST = 11:30 UTC
  if (hour === 11 && minute === 30) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(3)),
      type: "reminder_meal",
    });
    remindersSent.push("snack");
  }

  // Dinner: 9:30pm IST = 16:00 UTC
  if (hour === 16 && minute === 0) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(MEAL_REMINDERS.slice(2, 3)),
      type: "reminder_meal",
    });
    remindersSent.push("dinner");
  }

  // ── Workout reminder: 7:30pm IST = 14:00 UTC ──────────────────────────────
  if (hour === 14 && minute === 0) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(WORKOUT_REMINDERS),
      type: "reminder_workout",
    });
    remindersSent.push("workout");
  }

  // ── Water reminders: every 1.5 hours (11 slots, :00/:30 ticks only) ─────────
  if (WATER_SLOTS_UTC.some(([h, m]) => h === hour && m === minute)) {
    await sendPushToUsers(supabase, allUserIds, {
      ...pick(WATER_REMINDERS),
      type: "reminder_water",
    });
    remindersSent.push("water");
  }

  // ── Motivation: Sun / Mon / Wed / Thu at 8:00 AM IST = 02:30 UTC ──────────
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (MOTIVATION_DAYS_UTC.has(day) && hour === 2 && minute === 30) {
    const m = pick(MOTIVATION);
    await sendPushToAll(supabase, {
      ...m,
      type: "motivation",
      tag: "motivation",
      url: "/",
    });
    remindersSent.push("motivation");
  }

  results.reminders = remindersSent;
  return NextResponse.json(results);
}
