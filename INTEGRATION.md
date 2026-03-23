# Push Notifications — Integration Guide

## What's included

| File | What it does |
|---|---|
| `supabase/push_notifications_schema.sql` | Run once in Supabase SQL editor |
| `lib/push.ts` | Core `sendPushToUsers` / `sendPushToAll` utility |
| `hooks/usePushNotifications.ts` | Client hook — subscribe/unsubscribe |
| `components/NotificationSettings.tsx` | User-facing toggle card |
| `components/AdminNotifications.tsx` | Admin tab — schedule & blast |
| `app/api/push/subscribe/route.ts` | POST/DELETE — save/remove subscriptions |
| `app/api/push/send/route.ts` | POST — admin immediate send |
| `app/api/push/schedule/route.ts` | GET/POST/DELETE — scheduled notifications |
| `app/api/push/cron/route.ts` | GET — cron job processor |
| `app/api/admin/users/route.ts` | GET — admin user list (for targeting) |
| `public/sw.js` | Updated service worker v2 |
| `.env.local.example` | Required env vars |

---

## Step 1 — Run the database migration

Open Supabase Dashboard → SQL Editor → New Query, paste and run:
```
supabase/push_notifications_schema.sql
```

---

## Step 2 — Install the dependency

```bash
npm install web-push
npm install --save-dev @types/web-push
```

---

## Step 3 — Generate VAPID keys

Run once and copy the output into your `.env.local`:

```bash
npm run generate-vapid-keys
```

Or directly:
```bash
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"
```

Add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:you@yourdomain.com
CRON_SECRET=<random_long_string>
```

---

## Step 4 — Replace files

Copy the following files into your project (they replace existing files):
- `public/sw.js` → replaces your existing service worker

Copy the following new files into your project:
- `lib/push.ts`
- `hooks/usePushNotifications.ts`
- `components/NotificationSettings.tsx`
- `components/AdminNotifications.tsx`
- `app/api/push/subscribe/route.ts`
- `app/api/push/send/route.ts`
- `app/api/push/schedule/route.ts`
- `app/api/push/cron/route.ts`
- `app/api/admin/users/route.ts`

---

## Step 5 — Add NotificationSettings to Dashboard

In `components/Dashboard.tsx`, import and place the component:

```tsx
import NotificationSettings from '@/components/NotificationSettings'

// Inside your Dashboard JSX, e.g. at the bottom of the page:
<NotificationSettings />
```

---

## Step 6 — Add Notifications tab to Admin

In `app/admin/page.tsx`, add the notifications tab:

```tsx
import AdminNotifications from '@/components/AdminNotifications'
import { Bell } from 'lucide-react'

// In the Tab type:
type Tab = 'meals' | 'workouts' | 'notifications'

// In the tabs array:
{ key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> }

// In the render:
{tab === 'notifications' && <AdminNotifications />}
```

---

## Step 7 — Set up the cron job

The cron endpoint `GET /api/push/cron?secret=<CRON_SECRET>` needs to be called every minute.

### Option A: Vercel Cron (recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/push/cron",
      "schedule": "* * * * *"
    }
  ]
}
```

Add `x-cron-secret` header in your Vercel environment, or use the `?secret=` query param by
updating the route to read from `CRON_SECRET`.

### Option B: External cron (cron-job.org, GitHub Actions)

Set up a GET request every minute to:
```
https://yourdomain.com/api/push/cron?secret=YOUR_CRON_SECRET
```

### Option C: GitHub Actions

```yaml
# .github/workflows/cron.yml
name: Push notification cron
on:
  schedule:
    - cron: '* * * * *'
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s "${{ secrets.APP_URL }}/api/push/cron?secret=${{ secrets.CRON_SECRET }}"
```

---

## Reminder schedule (UTC, adjust for your timezone)

| UTC Hour | Reminder |
|---|---|
| 01:00 | Morning workout nudge |
| 02:00 | Breakfast + motivation (Tue/Thu) |
| 04:00 | Water check-in |
| 07:00 | Lunch reminder |
| 08:00 | Water check-in |
| 10:00 | Snack reminder |
| 12:00 | Water check-in |
| 13:00 | Evening workout nudge |
| 14:00 | Dinner reminder |

The hours above are calibrated for IST (UTC+5:30). To adjust for a different timezone,
edit the `hour` comparisons in `app/api/push/cron/route.ts`.

---

## Testing

Send a test push immediately from the admin panel (Send now mode), or call:

```bash
curl -X POST https://yourapp.com/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: lemon_session=<admin_session_cookie>" \
  -d '{"title":"Test","body":"Hello from Lemon!","target_type":"all"}'
```
