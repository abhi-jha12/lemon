'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function SignupPage() {
  const { signup } = useAuth()
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await signup(name, email, password)
      router.push('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bark-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="blob-bg w-80 h-80 bg-lemon-500 top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <div className="blob-bg w-64 h-64 bg-forest-600 bottom-0 left-0 -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <span className="text-4xl animate-float inline-block">🍋</span>
          <h1 className="font-display text-3xl font-bold text-lemon-300 italic mt-2">Lemon</h1>
          <p className="text-sm text-lemon-100/40 mt-1">Start your wellness journey</p>
        </div>

        <div className="card p-6 lemon-glow">
          <h2 className="font-display text-xl font-semibold text-lemon-200 mb-1">Create account</h2>
          <p className="text-xs text-lemon-100/40 mb-5">Join Lemon and track your health</p>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 mb-4 text-xs text-red-300 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-lemon-100/50 mb-1.5 block">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" required
                className="w-full bg-bark-800 border border-lemon-500/20 focus:border-lemon-400/50 rounded-xl px-4 py-3 text-sm text-lemon-100 outline-none transition-colors placeholder:text-lemon-100/20" />
            </div>

            <div>
              <label className="text-xs text-lemon-100/50 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-bark-800 border border-lemon-500/20 focus:border-lemon-400/50 rounded-xl px-4 py-3 text-sm text-lemon-100 outline-none transition-colors placeholder:text-lemon-100/20" />
            </div>

            <div>
              <label className="text-xs text-lemon-100/50 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required
                  className="w-full bg-bark-800 border border-lemon-500/20 focus:border-lemon-400/50 rounded-xl px-4 py-3 pr-11 text-sm text-lemon-100 outline-none transition-colors placeholder:text-lemon-100/20" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lemon-100/30 hover:text-lemon-100/60 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-lemon-100/50 mb-1.5 block">Confirm Password</label>
              <input type={showPwd ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password" required
                className={`w-full bg-bark-800 border rounded-xl px-4 py-3 text-sm text-lemon-100 outline-none transition-colors placeholder:text-lemon-100/20 ${
                  confirm && confirm !== password ? 'border-red-500/50' : 'border-lemon-500/20 focus:border-lemon-400/50'}`} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lemon-500/25 hover:bg-lemon-500/35 text-lemon-300 font-semibold text-sm border border-lemon-500/40 transition-all lemon-glow disabled:opacity-50 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-lemon-500/10 text-center">
            <p className="text-xs text-lemon-100/40">
              Already have an account?{' '}
              <Link href="/login" className="text-lemon-400 hover:text-lemon-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
