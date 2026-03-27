'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tab } from '@/app/page'
import { useAuth } from '@/context/AuthContext'
import { LogOut, ShieldCheck, ChevronDown } from 'lucide-react'

const tabSubtitles: Record<Tab, string> = {
  dashboard: 'Ready to crush today?',
  meals:     'Eat well, feel great',
  workout:   'Move with intention',
  macros:    'Fuel your body right',
  smoking:   'One day at a time',
  settings:  'Your personal setup',
}

export default function Header({ activeTab }: { activeTab: Tab }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const now      = new Date()
  const hour     = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const title    = activeTab === 'dashboard'
    ? `${greeting}, ${user?.name?.split(' ')[0] ?? ''}`
    : tabSubtitles[activeTab]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-safe">
      <div className="max-w-md mx-auto flex items-center justify-between py-4">
        <div className="animate-fade-in min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">🍋</span>
            <h1 className="font-display text-base font-semibold text-lemon-300 italic truncate max-w-[200px]">
              {title}
            </h1>
          </div>
          <p className="text-xs text-lemon-100/40">{tabSubtitles[activeTab]}</p>
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-lemon-500/15 hover:border-lemon-500/30 transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-lemon-100/40">
                {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
              <div className="flex items-center gap-1 justify-end">
                {user?.role === 'admin' && <ShieldCheck size={10} className="text-lemon-400" />}
                <span className="text-xs text-lemon-300 font-medium">{user?.name?.split(' ')[0]}</span>
              </div>
            </div>
            <ChevronDown size={12} className={`text-lemon-100/30 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden animate-fade-in"
              style={{ background: 'rgba(30,30,15,0.98)', border: '1px solid rgba(234,179,8,0.15)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="px-4 py-3 border-b border-lemon-500/10">
                <p className="text-xs font-semibold text-lemon-200 truncate">{user?.name}</p>
                <p className="text-xs text-lemon-100/40 truncate">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-xs text-lemon-400 bg-lemon-500/15 px-2 py-0.5 rounded-full mt-1.5 border border-lemon-500/25">
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => { setMenuOpen(false); router.push('/admin') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-lemon-300 hover:bg-lemon-500/10 transition-colors"
                >
                  <ShieldCheck size={13} /> Admin Panel
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); handleLogout() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-lemon-100/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-lemon-500/20 to-transparent" />
    </header>
  )
}
