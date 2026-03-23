import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAdminSupabase() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('lemon_session')
  if (!sessionCookie?.value) return { supabase: null, error: 'Unauthorized', session: null }
  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.role !== 'admin') return { supabase: null, error: 'Admin access required', session: null }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    return { supabase, session, error: null }
  } catch {
    return { supabase: null, error: 'Invalid session', session: null }
  }
}

export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { data, error: dbError } = await supabase
    .from('workout_templates')
    .select('*, exercises:workout_template_exercises(*)')
    .order('name')
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

export async function POST(req: NextRequest) {
  const { supabase, session, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { name, tag, emoji, duration_minutes, calories_burned, exercises } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })

  const { data: workout, error: wErr } = await supabase
    .from('workout_templates')
    .insert({ name: name.trim(), tag: tag || '', emoji: emoji || '💪',
              duration_minutes: +duration_minutes || 30, calories_burned: +calories_burned || 200,
              is_active: true, created_by: session!.id })
    .select().single()
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })

  // Insert exercises if provided
  if (exercises?.length) {
    const rows = exercises.map((ex: Record<string, unknown>, i: number) => ({
      ...ex, workout_template_id: workout.id, sort_order: i + 1,
    }))
    await supabase.from('workout_template_exercises').insert(rows)
  }

  return NextResponse.json({ template: workout }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { id, exercises, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data, error: dbError } = await supabase
    .from('workout_templates').update(updates).eq('id', id).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error: dbError } = await supabase.from('workout_templates').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
