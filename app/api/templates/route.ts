import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const [{ data: meals }, { data: workouts }] = await Promise.all([
    supabase.from('meal_templates').select('*').eq('is_active', true).order('category').order('name'),
    supabase.from('workout_templates').select('*, exercises:workout_template_exercises(*)').eq('is_active', true).order('name'),
  ])

  return NextResponse.json({ meals: meals ?? [], workouts: workouts ?? [] })
}
