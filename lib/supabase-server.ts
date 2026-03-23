import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url === 'https://your-project-ref.supabase.co') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
  }
  if (!key || key === 'your-anon-key-here') {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local')
  }

  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch { /* server component — safe to ignore */ }
      },
    },
  })
}
