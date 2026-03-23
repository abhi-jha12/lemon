import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email?.trim() || !password?.trim())
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, role, password_hash')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (!user)
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })

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
    const msg = e instanceof Error ? e.message : 'Login failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
