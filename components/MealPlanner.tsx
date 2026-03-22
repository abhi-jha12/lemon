'use client'
import { useState } from 'react'
import { Plus, Clock, Flame, ChevronDown, ChevronUp, X, Check } from 'lucide-react'

type Meal = {
  id: number
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
  emoji: string
}

const defaultMeals: Record<string, Meal[]> = {
  Breakfast: [
    { id: 1, name: 'Oats with Banana & Honey', calories: 380, protein: 12, carbs: 68, fat: 6, time: '7:30 AM', emoji: '🥣' },
  ],
  Lunch: [
    { id: 2, name: 'Grilled Chicken Rice Bowl', calories: 540, protein: 42, carbs: 55, fat: 12, time: '1:00 PM', emoji: '🍚' },
  ],
  Snack: [],
  Dinner: [
    { id: 3, name: 'Dal Tadka + Roti', calories: 420, protein: 18, carbs: 65, fat: 9, time: '8:00 PM', emoji: '🍛' },
  ],
}

const suggestions = [
  { name: 'Greek Yogurt Parfait', calories: 280, protein: 20, carbs: 32, fat: 7, emoji: '🫙' },
  { name: 'Paneer Bhurji + Toast', calories: 360, protein: 22, carbs: 28, fat: 16, emoji: '🍞' },
  { name: 'Smoothie Bowl', calories: 320, protein: 14, carbs: 48, fat: 8, emoji: '🥤' },
  { name: 'Egg White Omelette', calories: 180, protein: 26, carbs: 4, fat: 5, emoji: '🍳' },
  { name: 'Quinoa Salad', calories: 390, protein: 16, carbs: 52, fat: 11, emoji: '🥗' },
]

export default function MealPlanner() {
  const [meals, setMeals] = useState(defaultMeals)
  const [expanded, setExpanded] = useState<string | null>('Breakfast')
  const [showSuggest, setShowSuggest] = useState<string | null>(null)
  const [addedMsg, setAddedMsg] = useState<string | null>(null)

  const totalCals = Object.values(meals).flat().reduce((s, m) => s + m.calories, 0)
  const totalProtein = Object.values(meals).flat().reduce((s, m) => s + m.protein, 0)

  const addSuggestion = (slot: string, sug: typeof suggestions[0]) => {
    const now = new Date()
    const newMeal: Meal = {
      id: Date.now(),
      name: sug.name,
      calories: sug.calories,
      protein: sug.protein,
      carbs: sug.carbs,
      fat: sug.fat,
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      emoji: sug.emoji,
    }
    setMeals(prev => ({ ...prev, [slot]: [...prev[slot], newMeal] }))
    setAddedMsg(sug.name)
    setShowSuggest(null)
    setTimeout(() => setAddedMsg(null), 2000)
  }

  const removeMeal = (slot: string, id: number) => {
    setMeals(prev => ({ ...prev, [slot]: prev[slot].filter(m => m.id !== id) }))
  }

  const mealColors: Record<string, string> = {
    Breakfast: 'text-lemon-400 bg-lemon-500/10 border-lemon-500/20',
    Lunch: 'text-forest-400 bg-forest-500/10 border-forest-500/20',
    Snack: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Dinner: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Summary bar */}
      <div className="card p-4 lemon-glow">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-lemon-100/50 mb-1">Total Today</p>
            <p className="font-display text-2xl font-bold text-lemon-300">{totalCals} <span className="text-sm text-lemon-100/40">kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lemon-100/50 mb-1">Protein</p>
            <p className="font-display text-xl font-bold text-forest-400">{totalProtein}g</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lemon-100/50 mb-1">Remaining</p>
            <p className="font-display text-xl font-bold text-lemon-200">{2200 - totalCals}</p>
          </div>
        </div>
        <div className="progress-bar h-2 mt-3">
          <div className="progress-fill" style={{ width: `${Math.min((totalCals / 2200) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Added toast */}
      {addedMsg && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={16} />
          <span>Added {addedMsg}</span>
        </div>
      )}

      {/* Meal slots */}
      {Object.entries(meals).map(([slot, items]) => (
        <div key={slot} className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4"
            onClick={() => setExpanded(expanded === slot ? null : slot)}
          >
            <div className="flex items-center gap-3">
              <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${mealColors[slot]}`}>
                {slot}
              </div>
              <span className="text-xs text-lemon-100/40">
                {items.reduce((s, m) => s + m.calories, 0)} kcal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-lemon-100/30">{items.length} items</span>
              {expanded === slot ? <ChevronUp size={16} className="text-lemon-100/40" /> : <ChevronDown size={16} className="text-lemon-100/40" />}
            </div>
          </button>

          {expanded === slot && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              {items.length === 0 && (
                <p className="text-xs text-lemon-100/30 text-center py-3">No meals logged yet</p>
              )}
              {items.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 bg-bark-800/60 rounded-xl p-3">
                  <span className="text-2xl">{meal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lemon-100 truncate">{meal.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-lemon-100/40">
                        <Flame size={10} className="text-orange-400" />
                        {meal.calories}
                      </span>
                      <span className="text-xs text-lemon-100/30">P:{meal.protein}g</span>
                      <span className="text-xs text-lemon-100/30">C:{meal.carbs}g</span>
                      <span className="flex items-center gap-1 text-xs text-lemon-100/30">
                        <Clock size={10} />
                        {meal.time}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeMeal(slot, meal.id)} className="text-lemon-100/20 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Add meal button */}
              <button
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-lemon-500/30 text-xs text-lemon-400/70 hover:border-lemon-400/60 hover:text-lemon-400 transition-all"
                onClick={() => setShowSuggest(showSuggest === slot ? null : slot)}
              >
                <Plus size={14} />
                Add {slot}
              </button>

              {showSuggest === slot && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs text-lemon-100/40 px-1">Suggestions for you:</p>
                  {suggestions.map((sug) => (
                    <button
                      key={sug.name}
                      className="w-full flex items-center gap-3 bg-bark-700/60 hover:bg-bark-700 rounded-xl p-3 text-left transition-all hover:border-lemon-500/30 border border-transparent"
                      onClick={() => addSuggestion(slot, sug)}
                    >
                      <span className="text-xl">{sug.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm text-lemon-100">{sug.name}</p>
                        <p className="text-xs text-lemon-100/40">{sug.calories} kcal · P:{sug.protein}g</p>
                      </div>
                      <Plus size={14} className="text-lemon-400/60 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Weekly Meal Plan Preview */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">This Week's Plan</p>
        <div className="space-y-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-xs text-lemon-100/40 w-8">{day}</span>
              <div className={`flex-1 h-2 rounded-full ${i < 4 ? 'bg-lemon-500/30' : 'bg-bark-600/40'}`}>
                {i < 4 && <div className="h-full rounded-full bg-gradient-to-r from-lemon-500 to-forest-500" style={{ width: `${[88, 72, 95, 64][i]}%` }} />}
              </div>
              <span className={`text-xs ${i < 4 ? 'text-lemon-400' : 'text-lemon-100/20'}`}>
                {i < 4 ? ['1840', '1620', '2100', '1950'][i] : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
