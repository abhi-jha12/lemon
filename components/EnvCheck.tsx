'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink } from 'lucide-react'

export default function EnvCheck() {
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (
      !url || url === 'https://your-project-ref.supabase.co' ||
      !key || key === 'your-anon-key-here'
    ) {
      setMissing(true)
    }
  }, [])

  if (!missing) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-slide-up">
      <div className="bg-red-900/90 border border-red-500/50 rounded-2xl p-4 backdrop-blur-sm"
           style={{ boxShadow: '0 8px 32px rgba(239,68,68,0.2)' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300 mb-1">Supabase not configured</p>
            <p className="text-xs text-red-300/70 mb-2">
              Add your keys to <code className="bg-red-800/60 px-1 py-0.5 rounded text-red-200">.env.local</code> and restart the dev server.
            </p>
            <div className="bg-red-950/60 rounded-xl p-2.5 font-mono text-xs text-red-200 space-y-1 mb-2">
              <p>NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...</p>
            </div>
            <a href="https://supabase.com/dashboard/project/_/settings/api"
               target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 underline underline-offset-2">
              Open Supabase API settings <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
