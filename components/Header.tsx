'use client'
import { Tab } from '@/app/page'

const tabTitles: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Good morning', subtitle: 'Ready to crush today?' },
  meals: { title: 'Meal Planner', subtitle: 'Eat well, feel great' },
  workout: { title: 'Workout Planner', subtitle: 'Move with intention' },
  macros: { title: 'Macro Tracker', subtitle: 'Fuel your body right' },
}

export default function Header({ activeTab }: { activeTab: Tab }) {
  const { title, subtitle } = tabTitles[activeTab]
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayTitle = activeTab === 'dashboard' ? greeting : title

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-safe">
      <div className="max-w-md mx-auto flex items-center justify-between py-4">
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl">🍋</span>
            <h1 className="font-display text-lg font-semibold text-lemon-300 italic">Lemon</h1>
          </div>
          <p className="text-xs text-lemon-100/50 font-body">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-lemon-100/40">
            {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          <div className="mt-1 flex items-center gap-1 justify-end">
            <div className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-pulse-slow" />
            <span className="text-xs text-forest-400 font-medium">Active</span>
          </div>
        </div>
      </div>
      {/* Separator */}
      <div className="max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-lemon-500/20 to-transparent" />
    </header>
  )
}
