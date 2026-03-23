import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendPushToUsers, sendPushToAll } from '@/lib/push'

async function getAdminSupabase() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('lemon_session')
  if (!sessionCookie?.value) return { supabase: null, session: null, error: 'Unauthorized' }
  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.role !== 'admin') return { supabase: null, session: null, error: 'Admin access required' }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    return { supabase, session, error: null }
  } catch {
    return { supabase: null, session: null, error: 'Invalid session' }
  }
}

// POST /api/push/send — admin sends a push immediately
export async function POST(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { title, body, icon, url, target_type, target_user } = await req.json()

  if (!title?.trim() || !body?.trim())
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })

  const payload = {
    title: title.trim(),
    body:  body.trim(),
    icon:  icon  || '/icon-192.png',
    url:   url   || '/',
    type:  'manual',
    tag:   'lemon-admin',
  }

  let results
  if (target_type === 'user' && target_user) {
    results = await sendPushToUsers(supabase, [target_user], payload)
  } else {
    results = await sendPushToAll(supabase, payload)
  }

  const sent  = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  return NextResponse.json({ sent, failed })
}
