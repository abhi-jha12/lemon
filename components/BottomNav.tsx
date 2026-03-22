'use client'
import { Tab } from '@/app/page'
import { LayoutDashboard, UtensilsCrossed, Dumbbell, BarChart3 } from 'lucide-react'

const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'meals', icon: UtensilsCrossed, label: 'Meals' },
  { id: 'workout', icon: Dumbbell, label: 'Workout' },
  { id: 'macros', icon: BarChart3, label: 'Macros' },
]

export default function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto px-4 pb-4">
        <div
          className="flex items-center justify-around rounded-2xl p-2"
          style={{
            background: 'rgba(26, 26, 14, 0.95)',
            border: '1px solid rgba(234, 179, 8, 0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(234, 179, 8, 0.05)',
          }}
        >
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'tab-active'
                    : 'text-lemon-100/40 hover:text-lemon-100/70 border border-transparent'
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-all duration-300 ${isActive ? 'text-lemon-300' : ''}`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className={`text-xs font-medium transition-all duration-300 ${isActive ? 'text-lemon-300' : ''}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
