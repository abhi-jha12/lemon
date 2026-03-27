"use client";
import { useState } from "react";
import {
  Plus,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { useMeals, useMealTemplates, useUserSettings } from "@/hooks/useData";
import type { MealLog, MealTemplate } from "@/types";

const SLOTS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;
type Slot = (typeof SLOTS)[number];

const SLOT_COLORS: Record<Slot, string> = {
  Breakfast: "text-lemon-400 bg-lemon-500/10 border-lemon-500/20",
  Lunch: "text-forest-400 bg-forest-500/10 border-forest-500/20",
  Snack: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Dinner: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

type CustomForm = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  emoji: string;
};
const EMPTY_FORM: CustomForm = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  emoji: "🍽️",
};

const getDefaultSlot = (): Slot => {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 15) return "Lunch";
  if (hour < 18) return "Snack";
  return "Dinner";
};

export default function MealPlanner() {
  const { meals, totals, loading, error, addMeal, deleteMeal } = useMeals();
  const { data: allTemplates, loading: tplLoading } = useMealTemplates();
  const { settings } = useUserSettings();

  const CALORIE_GOAL = settings?.calorie_goal ?? 2200;

  const [expanded, setExpanded] = useState<Slot | null>(getDefaultSlot);
  const [showSuggest, setShowSuggest] = useState<Slot | null>(null);
  const [showCustom, setShowCustom] = useState<Slot | null>(null);
  const [browseSlot, setBrowseSlot] = useState<Record<string, Slot>>({});
  const [form, setForm] = useState<CustomForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const mealsBySlot = SLOTS.reduce(
    (acc, s) => {
      acc[s] = meals.filter((m: MealLog) => m.meal_slot === s);
      return acc;
    },
    {} as Record<Slot, MealLog[]>,
  );

  const getTemplatesForSlot = (slot: Slot): MealTemplate[] => {
    if (!allTemplates) return [];
    return allTemplates.filter(
      (t) => t.category === slot || t.category === "General",
    );
  };

  const handleAddTemplate = async (slot: Slot, tpl: MealTemplate) => {
    setSaving(true);
    try {
      await addMeal({
        meal_slot: slot,
        name: tpl.name,
        emoji: tpl.emoji,
        calories: tpl.calories,
        protein: tpl.protein,
        carbs: tpl.carbs,
        fat: tpl.fat,
      });
      showToast(`Added ${tpl.name}`);
      setShowSuggest(null);
    } catch {
      showToast("Failed to save — check Supabase config");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustom = async (slot: Slot) => {
    if (!form.name || !form.calories) return;
    setSaving(true);
    try {
      await addMeal({
        meal_slot: slot,
        name: form.name,
        emoji: form.emoji,
        calories: +form.calories || 0,
        protein: +form.protein || 0,
        carbs: +form.carbs || 0,
        fat: +form.fat || 0,
      });
      showToast(`Added ${form.name}`);
      setForm(EMPTY_FORM);
      setShowCustom(null);
    } catch {
      showToast("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Summary bar */}
      <div className="card p-4 lemon-glow">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-lemon-100/50 mb-1">Total Today</p>
            <p className="font-display text-2xl font-bold text-lemon-300">
              {loading ? "…" : totals.calories}{" "}
              <span className="text-sm text-lemon-100/40">kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lemon-100/50 mb-1">Protein</p>
            <p className="font-display text-xl font-bold text-forest-400">
              {totals.protein}g
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lemon-100/50 mb-1">Remaining</p>
            <p className="font-display text-xl font-bold text-lemon-200">
              {Math.max(CALORIE_GOAL - totals.calories, 0)}
            </p>
          </div>
        </div>
        <div className="progress-bar h-2 mt-3">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min((totals.calories / CALORIE_GOAL) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
          ⚠️{" "}
          {error.includes("Missing Supabase")
            ? "Add your Supabase keys to .env.local"
            : error}
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2 bg-forest-800/80 border border-forest-500/40 rounded-xl p-3 text-sm text-forest-300 animate-fade-in">
          <Check size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Meal slots */}
      {SLOTS.map((slot) => (
        <div key={slot} className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4"
            onClick={() => setExpanded(expanded === slot ? null : slot)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${SLOT_COLORS[slot]}`}
              >
                {slot}
              </div>
              <span className="text-xs text-lemon-100/40">
                {mealsBySlot[slot].reduce((s, m) => s + m.calories, 0)} kcal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-lemon-100/30">
                {mealsBySlot[slot].length} items
              </span>
              {expanded === slot ? (
                <ChevronUp size={16} className="text-lemon-100/40" />
              ) : (
                <ChevronDown size={16} className="text-lemon-100/40" />
              )}
            </div>
          </button>

          {expanded === slot && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              {loading && (
                <p className="text-xs text-lemon-100/30 text-center py-2">
                  Loading…
                </p>
              )}
              {!loading && mealsBySlot[slot].length === 0 && (
                <p className="text-xs text-lemon-100/30 text-center py-3">
                  No meals logged yet
                </p>
              )}

              {mealsBySlot[slot].map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-3 bg-bark-800/60 rounded-xl p-3"
                >
                  <span className="text-2xl">{meal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-lemon-100 truncate">
                      {meal.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-lemon-100/40">
                        <Flame size={10} className="text-orange-400" />
                        {meal.calories}
                      </span>
                      <span className="text-xs text-lemon-100/30">
                        P:{meal.protein}g
                      </span>
                      <span className="text-xs text-lemon-100/30">
                        C:{meal.carbs}g
                      </span>
                      <span className="flex items-center gap-1 text-xs text-lemon-100/30">
                        <Clock size={10} />
                        {new Date(meal.logged_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    className="text-lemon-100/20 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Add buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowSuggest(showSuggest === slot ? null : slot);
                    setShowCustom(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-lemon-500/30 text-xs text-lemon-400/70 hover:border-lemon-400/60 hover:text-lemon-400 transition-all"
                >
                  <Plus size={12} /> Quick add
                </button>
                <button
                  onClick={() => {
                    setShowCustom(showCustom === slot ? null : slot);
                    setShowSuggest(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-lemon-500/30 text-xs text-lemon-400/70 hover:border-lemon-400/60 hover:text-lemon-400 transition-all"
                >
                  <Plus size={12} /> Custom
                </button>
              </div>

              {/* Template suggestions */}
              {showSuggest === slot && (
                <div className="space-y-2 animate-fade-in">
                  {/* Category tabs */}
                  <div className="flex gap-1 flex-wrap">
                    {SLOTS.map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setBrowseSlot((prev) => ({ ...prev, [slot]: s }))
                        }
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                          (browseSlot[slot] ?? slot) === s
                            ? SLOT_COLORS[s]
                            : "text-lemon-100/30 border-lemon-500/10 hover:text-lemon-100/60 hover:border-lemon-500/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-lemon-100/40 px-1">
                    {tplLoading
                      ? "Loading meals…"
                      : `${getTemplatesForSlot(browseSlot[slot] ?? slot).length} options for ${browseSlot[slot] ?? slot}:`}
                  </p>

                  {tplLoading && (
                    <div className="flex justify-center py-3">
                      <Loader2
                        size={16}
                        className="text-lemon-400/50 animate-spin"
                      />
                    </div>
                  )}

                  {getTemplatesForSlot(browseSlot[slot] ?? slot).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleAddTemplate(slot, tpl)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 bg-bark-700/60 hover:bg-bark-700 rounded-xl p-3 text-left transition-all border border-transparent hover:border-lemon-500/20 disabled:opacity-50"
                    >
                      <span className="text-xl">{tpl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-lemon-100 truncate">
                          {tpl.name}
                        </p>
                        <p className="text-xs text-lemon-100/40">
                          {tpl.calories} kcal · P:{tpl.protein}g · C:{tpl.carbs}
                          g · F:{tpl.fat}g
                        </p>
                      </div>
                      {saving ? (
                        <Loader2
                          size={14}
                          className="text-lemon-400/60 animate-spin flex-shrink-0"
                        />
                      ) : (
                        <Plus
                          size={14}
                          className="text-lemon-400/60 flex-shrink-0"
                        />
                      )}
                    </button>
                  ))}

                  {!tplLoading &&
                    getTemplatesForSlot(browseSlot[slot] ?? slot).length ===
                      0 && (
                      <p className="text-xs text-lemon-100/25 text-center py-2 italic">
                        No templates yet — admin can add them
                      </p>
                    )}
                </div>
              )}

              {/* Custom form */}
              {showCustom === slot && (
                <div className="bg-bark-700/50 rounded-xl p-3 space-y-2 animate-fade-in">
                  <p className="text-xs text-lemon-100/50 mb-2">Custom meal</p>
                  <div className="flex gap-2">
                    <input
                      value={form.emoji}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, emoji: e.target.value }))
                      }
                      className="w-11 bg-bark-800 rounded-xl text-center text-xl border border-lemon-500/20 focus:border-lemon-400/50 outline-none p-2"
                    />
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Meal name *"
                      className="flex-1 bg-bark-800 rounded-xl px-3 py-2 text-sm text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/25"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ["calories", "Kcal *"],
                        ["protein", "Protein g"],
                        ["carbs", "Carbs g"],
                        ["fat", "Fat g"],
                      ] as const
                    ).map(([k, l]) => (
                      <input
                        key={k}
                        type="number"
                        value={form[k]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [k]: e.target.value }))
                        }
                        placeholder={l}
                        className="bg-bark-800 rounded-xl px-2 py-2 text-xs text-lemon-100 border border-lemon-500/20 focus:border-lemon-400/50 outline-none placeholder:text-lemon-100/25 w-full"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddCustom(slot)}
                    disabled={!form.name || !form.calories || saving}
                    className="w-full py-2 rounded-lg bg-lemon-500/20 text-lemon-300 text-sm font-medium border border-lemon-500/30 hover:bg-lemon-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      "Add Meal"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
