"use client";
import NotificationSettings from '@/components/NotificationSettings'
import {
  Flame, Droplets, Moon, TrendingUp, Zap, Target, Award,
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { useMeals, useDailyLog, useWeeklyWorkouts, useWeight, useUserSettings, useSmokingToday } from "@/hooks/useData";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

export default function Dashboard() {
  const { totals, loading: mealsLoading }      = useMeals();
  const { water, sleep, setWater, setSleep }   = useDailyLog();
  const { data: weekWorkouts }                 = useWeeklyWorkouts();
  const { latest: latestWeight, change: weightChange } = useWeight(30);
  const { settings }                           = useUserSettings();
  const { smokedToday }                        = useSmokingToday();

  const CALORIE_GOAL = settings?.calorie_goal ?? 2200;
  const PROTEIN_GOAL = settings?.protein_goal ?? 120;
  const CARBS_GOAL   = settings?.carbs_goal   ?? 220;
  const FAT_GOAL     = settings?.fat_goal     ?? 65;
  const WATER_GOAL   = settings?.water_goal   ?? 8;

  const caloriesNet  = totals.calories;
  const caloriesPct  = Math.min(Math.round((caloriesNet / CALORIE_GOAL) * 100), 100);
  const radialData   = [{ value: caloriesPct, fill: "#eab308" }];

  const todayIdx    = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const workoutDates = new Set(
    (weekWorkouts ?? []).filter((w) => w.completed).map((w) => w.date)
  );
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - todayIdx);
  const weekDayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const macros = [
    { label: "Protein", value: totals.protein, goal: PROTEIN_GOAL, bar: Math.min(Math.round((totals.protein / PROTEIN_GOAL) * 100), 100), color: "text-lemon-400" },
    { label: "Carbs",   value: totals.carbs,   goal: CARBS_GOAL,   bar: Math.min(Math.round((totals.carbs / CARBS_GOAL) * 100), 100),     color: "text-forest-400" },
    { label: "Fat",     value: totals.fat,     goal: FAT_GOAL,     bar: Math.min(Math.round((totals.fat / FAT_GOAL) * 100), 100),         color: "text-lemon-600" },
  ];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Streak / weight banner */}
      <div className="card p-4 lemon-glow flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-lemon-500/20 flex items-center justify-center flex-shrink-0">
          <Award size={24} className="text-lemon-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-lemon-100/50 mb-0.5">Current Weight</p>
          <p className="font-display text-xl font-bold text-lemon-300">
            {latestWeight ? `${latestWeight.weight_kg} kg` : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-lemon-100/50">30-day change</p>
          <p className={`text-sm font-semibold ${weightChange < 0 ? "text-forest-400" : weightChange > 0 ? "text-red-400" : "text-lemon-400"}`}>
            {weightChange > 0 ? "+" : ""}{weightChange} kg
          </p>
        </div>
      </div>

      {/* Calorie ring + water/sleep */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 card p-4">
          <p className="text-xs text-lemon-100/50 mb-2 font-medium">Today's Calories</p>
          <div className="relative h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
                barSize={8} data={[{ value: 100, fill: "rgba(234,179,8,0.1)" }, ...radialData]}
                startAngle={90} endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {mealsLoading ? (
                <span className="text-xs text-lemon-100/40">Loading…</span>
              ) : (
                <>
                  <span className="font-display text-xl font-bold text-lemon-300">{caloriesNet}</span>
                  <span className="text-xs text-lemon-100/40">of {CALORIE_GOAL}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-center">
              <p className="text-xs text-lemon-100/40">Eaten</p>
              <p className="text-sm font-semibold text-lemon-200">{totals.calories}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-lemon-100/40">Goal</p>
              <p className="text-sm font-semibold text-forest-400">{CALORIE_GOAL}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-lemon-100/40">Left</p>
              <p className="text-sm font-semibold text-lemon-400">{Math.max(CALORIE_GOAL - caloriesNet, 0)}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          {/* Water */}
          <div className="card p-3 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-xs text-lemon-100/50">Water</span>
            </div>
            <p className="font-display text-lg font-bold text-blue-300">
              {water}<span className="text-sm text-lemon-100/40">/{WATER_GOAL}</span>
            </p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {Array.from({ length: WATER_GOAL }).map((_, i) => (
                <button key={i} onClick={() => setWater(i + 1)} className="transition-all hover:scale-110" title={`${i + 1} glasses`}>
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 2 L2 18 Q2 19 3 19 L13 19 Q14 19 14 18 L13 2 Z" stroke={i < water ? "#60a5fa" : "#1e3a5f"} strokeWidth="1.2" fill="none" />
                    {i < water && <path d="M3.4 10 L2.3 18 Q2.3 18.7 3 18.7 L13 18.7 Q13.7 18.7 13.7 18 L12.6 10 Z" fill="#3b82f6" opacity="0.7" />}
                    <line x1="3" y1="2" x2="13" y2="2" stroke={i < water ? "#93c5fd" : "#1e3a5f"} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep */}
          <div className="card p-3 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Moon size={14} className="text-purple-400" />
              <span className="text-xs text-lemon-100/50">Sleep</span>
            </div>
            <p className="font-display text-lg font-bold text-purple-300">
              {sleep > 0 ? `${sleep}` : "—"}<span className="text-sm text-lemon-100/40">h</span>
            </p>
            <div className="flex gap-2 mt-1.5">
              {[{ h: 6 }, { h: 7 }, { h: 8 }, { h: 9 }].map(({ h }) => (
                <button key={h} onClick={() => setSleep(h)} className="flex flex-col items-center gap-0.5 transition-all hover:scale-110">
                  <div className={`w-4 h-4 rounded-full border transition-all ${sleep === h ? 'bg-purple-500/60 border-purple-400' : 'border-lemon-100/20'}`} />
                  <span className={`text-xs leading-none ${sleep === h ? "text-purple-300 font-semibold" : "text-lemon-100/30"}`}>{h}h</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-lemon-200">Macros Today</p>
          <span className="text-xs text-lemon-100/40">% of goal</span>
        </div>
        <div className="space-y-3">
          {macros.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-lemon-100/60">{s.label}</span>
                <span className={`text-xs font-medium ${s.color}`}>
                  {s.value}g <span className="text-lemon-100/30">/ {s.goal}g</span>
                </span>
              </div>
              <div className="progress-bar h-1.5">
                <div className="progress-fill" style={{ width: `${s.bar}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smoking quick status */}
      <div className="card p-3 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${smokedToday > 0 ? 'bg-red-500/15' : 'bg-forest-500/15'}`}>
          <span className="text-base">{smokedToday > 0 ? '🚬' : '🟢'}</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-lemon-200">Today's smoking</p>
          <p className="text-xs text-lemon-100/40">
            {smokedToday === 0 ? 'Smoke-free so far — great!' : `${smokedToday} cigarette${smokedToday > 1 ? 's' : ''} logged today`}
          </p>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-lemon-200">Weekly Activity</p>
          <div className="flex items-center gap-1 text-xs text-forest-400">
            <TrendingUp size={12} />
            <span>{workoutDates.size}/7 days</span>
          </div>
        </div>
        <div className="flex justify-between">
          {weekDays.map((day, i) => {
            const isToday    = i === todayIdx;
            const hasWorkout = workoutDates.has(weekDayDates[i]);
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isToday ? "bg-lemon-500/30 border border-lemon-400/50 lemon-glow"
                          : hasWorkout ? "bg-forest-800/60 border border-forest-600/40"
                          : "bg-bark-600/40 border border-bark-500/20"
                }`}>
                  {hasWorkout
                    ? <Zap size={14} className={isToday ? "text-lemon-300" : "text-forest-400"} />
                    : <span className="w-1.5 h-1.5 rounded-full bg-bark-500" />
                  }
                </div>
                <span className={`text-xs ${isToday ? "text-lemon-400 font-semibold" : "text-lemon-100/30"}`}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-lemon-200 mb-3">Today's Goals</p>
        <div className="space-y-2">
          {[
            { label: `Drink ${WATER_GOAL} glasses of water`,  done: water >= WATER_GOAL },
            { label: "Log all meals",                          done: totals.calories > 0 },
            { label: "Complete a workout",                     done: (weekWorkouts ?? []).some(w => w.date === new Date().toISOString().split("T")[0] && w.completed) },
            { label: "Stay under calorie goal",                done: caloriesNet > 0 && caloriesNet <= CALORIE_GOAL },
            { label: "No cigarettes today",                    done: smokedToday === 0 },
          ].map((goal, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                goal.done ? "bg-forest-500/30 border border-forest-400/60" : "border border-lemon-100/20"
              }`}>
                {goal.done && <span className="text-forest-400 text-xs">✓</span>}
              </div>
              <span className={`text-sm ${goal.done ? "text-lemon-100/40 line-through" : "text-lemon-100/70"}`}>{goal.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <NotificationSettings />
      </div>
    </div>
  );
}
