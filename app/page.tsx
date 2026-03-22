'use client'
import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import MealPlanner from '@/components/MealPlanner'
import WorkoutPlanner from '@/components/WorkoutPlanner'
import MacroTracker from '@/components/MacroTracker'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

export type Tab = 'dashboard' | 'meals' | 'workout' | 'macros'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className="min-h-screen bg-bark-900 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="blob-bg w-96 h-96 bg-lemon-500 top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <div className="blob-bg w-80 h-80 bg-forest-600 bottom-20 left-0 -translate-x-1/3" />
      <div className="blob-bg w-64 h-64 bg-lemon-300 top-1/2 left-1/2" />

      <Header activeTab={activeTab} />

      <main className="pb-24 pt-20 px-4 max-w-md mx-auto relative z-10">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'meals' && <MealPlanner />}
        {activeTab === 'workout' && <WorkoutPlanner />}
        {activeTab === 'macros' && <MacroTracker />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
