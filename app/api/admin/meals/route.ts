import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAdminSupabase() {
  const cookieStore = await cookies()
  // Verify admin session
  const sessionCookie = cookieStore.get('lemon_session')
  if (!sessionCookie?.value) return { supabase: null, error: 'Unauthorized' }
  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.role !== 'admin') return { supabase: null, error: 'Admin access required' }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    return { supabase, session, error: null }
  } catch {
    return { supabase: null, error: 'Invalid session' }
  }
}

// GET all meal templates (including inactive)
export async function GET() {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { data, error: dbError } = await supabase
    .from('meal_templates').select('*').order('category').order('name')
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

// POST create new meal template
export async function POST(req: NextRequest) {
  const { supabase, session, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { name, emoji, calories, protein, carbs, fat, category } = body

  if (!name?.trim() || !calories)
    return NextResponse.json({ error: 'Name and calories are required.' }, { status: 400 })

  const { data, error: dbError } = await supabase
    .from('meal_templates')
    .insert({ name: name.trim(), emoji: emoji || '🍽️', calories: +calories, protein: +protein || 0,
               carbs: +carbs || 0, fat: +fat || 0, category: category || 'General',
               is_active: true, created_by: session!.id })
    .select().single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}

// PATCH update meal template
export async function PATCH(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data, error: dbError } = await supabase
    .from('meal_templates').update(updates).eq('id', id).select().single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// DELETE meal template
export async function DELETE(req: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (!supabase) return NextResponse.json({ error }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error: dbError } = await supabase.from('meal_templates').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
