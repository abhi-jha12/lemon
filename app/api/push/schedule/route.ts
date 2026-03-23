import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

// GET — list scheduled notifications (most recent first)
export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { data, error: dbErr } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(100)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ notifications: data })
}

// POST — create a new scheduled notification
export async function POST(req: NextRequest) {
  const { supabase, session, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { title, body: msgBody, icon, url, target_type, target_user, scheduled_at } = body

  if (!title?.trim() || !msgBody?.trim() || !scheduled_at)
    return NextResponse.json({ error: 'title, body and scheduled_at are required' }, { status: 400 })

  if (target_type === 'user' && !target_user)
    return NextResponse.json({ error: 'target_user required when target_type is user' }, { status: 400 })

  const { data, error: dbErr } = await supabase
    .from('scheduled_notifications')
    .insert({
      title:       title.trim(),
      body:        msgBody.trim(),
      icon:        icon  || '/icon-192.png',
      url:         url   || '/',
      target_type: target_type || 'all',
      target_user: target_type === 'user' ? target_user : null,
      scheduled_at,
      created_by: session!.id,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ notification: data }, { status: 201 })
}

// DELETE — cancel a pending notification
export async function DELETE(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Don't allow deleting already-sent notifications (just unsend would be impossible anyway)
  const { data: existing } = await supabase
    .from('scheduled_notifications')
    .select('sent_at')
    .eq('id', id)
    .single()

  if (existing?.sent_at)
    return NextResponse.json({ error: 'Cannot delete an already-sent notification' }, { status: 400 })

  const { error: dbErr } = await supabase
    .from('scheduled_notifications')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
