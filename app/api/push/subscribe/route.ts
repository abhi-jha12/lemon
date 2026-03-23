import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const cookie = cookieStore.get('lemon_session')
  if (!cookie?.value) return null
  try { return JSON.parse(cookie.value) } catch { return null }
}

// POST /api/push/subscribe  — save a subscription
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { endpoint, keys } = body?.subscription ?? {}
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })

  const supabase = makeSupabase(cookieStore)
  const userAgent = req.headers.get('user-agent') ?? ''

  // Upsert by endpoint — if the device re-subscribes, update the keys
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id:   session.id,
        endpoint,
        p256dh:    keys.p256dh,
        auth:      keys.auth,
        user_agent: userAgent.slice(0, 255),
      },
      { onConflict: 'endpoint' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe  — remove a subscription (user unsubscribes)
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

  const supabase = makeSupabase(cookieStore)
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', session.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
