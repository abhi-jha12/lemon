import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('lemon_session')
  if (!sessionCookie?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ users: data })
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}
