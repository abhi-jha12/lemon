import { createBrowserClient } from '@supabase/ssr'

/**
 * Always create a fresh client — no singleton caching.
 * This ensures env vars are always read after Next.js loads .env.local.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url === 'https://your-project-ref.supabase.co') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Add it to .env.local — get it from Supabase Dashboard → Settings → API.'
    )
  }
  if (!key || key === 'your-anon-key-here') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Add it to .env.local — get it from Supabase Dashboard → Settings → API.'
    )
  }

  return createBrowserClient(url, key)
}

export const supabase = () => getSupabaseBrowserClient()
