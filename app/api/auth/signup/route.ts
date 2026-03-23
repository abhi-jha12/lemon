import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password?.trim())
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = makeSupabase(cookieStore)

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).maybeSingle()
    if (existing)
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })

    const password_hash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: name.trim(), email: email.toLowerCase().trim(), password_hash, role: 'user' })
      .select('id, name, email, role')
      .single()
    if (error) throw error

    const session = { id: user.id, name: user.name, email: user.email, role: user.role }
    const res = NextResponse.json({ user: session })
    res.cookies.set('lemon_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Signup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
