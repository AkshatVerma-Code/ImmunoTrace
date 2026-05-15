import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Header } from "../components/Header";
import { useDemoMode } from "../context/DemoContext";
import { BrainCircuit, Download, Droplets, Loader2, Sparkles, Utensils, WheatOff } from "lucide-react";

type DietMeal = {
  name: string;
  time?: string;
  items: string[];
  notes?: string;
};

type DietPlanData = {
  summary: string;
  daily_calories: number;
  hydration_liters: number;
  meals: DietMeal[];
  avoid: string[];
  tips: string[];
  kada_recipe?: {
    name: string;
    purpose: string;
    ingredients: string[];
    preparation_steps: string[];
    when_to_take: string;
    cautions: string[];
  };
};

type DietHistoryItem = {
  id: number;
  goal: string;
  preferences: string[];
  created_at: string;
  plan: DietPlanData;
};

const GOALS = [
  "Balanced wellness",
  "Weight loss",
  "Weight gain",
  "Diabetes-friendly",
  "Heart healthy",
];

export function DietPlan() {
  const { isDemoMode } = useDemoMode();
  const [goal, setGoal] = useState(GOALS[0]);
  const [preferencesInput, setPreferencesInput] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<DietHistoryItem[]>([]);
  const [activeItem, setActiveItem] = useState<DietHistoryItem | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/diet-plan", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load diet plans.");
      const items: DietHistoryItem[] = Array.isArray(data.items) ? data.items : [];
      setHistory(items);
      setActiveItem(items[0] || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load diet plans.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const canGenerate = useMemo(() => !loading && goal.length > 0, [goal, loading]);

  const addPreference = () => {
    const value = preferencesInput.trim();
    if (!value) return;
    if (!preferences.includes(value)) {
      setPreferences((prev) => [...prev, value]);
    }
    setPreferencesInput("");
  };

  const removePreference = (value: string) => {
    setPreferences((prev) => prev.filter((item) => item !== value));
  };

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!canGenerate) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          preferences,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate diet plan.");

      const item = data.item as DietHistoryItem;
      setActiveItem(item);
      setHistory((prev) => [item, ...prev]);
    } catch (e: any) {
      setError(e?.message || "Failed to generate diet plan.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!activeItem) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    const right = 555;
    let y = 42;

    const writeTitle = (text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(text, left, y);
      y += 22;
    };

    const writeBody = (text: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(text, right - left) as string[];
      for (const line of lines) {
        if (y > 800) {
          doc.addPage();
          y = 42;
        }
        doc.text(line, left, y);
        y += 15;
      }
    };

    const writeList = (items: string[]) => {
      for (const item of items) {
        writeBody(`• ${item}`);
      }
    };

    writeTitle("ImmunoTrace - Personalized Diet Plan");
    writeBody(`Generated: ${new Date(activeItem.created_at).toLocaleString()}`);
    writeBody(`Goal: ${activeItem.goal}`);
    writeBody(`Preferences: ${activeItem.preferences.length > 0 ? activeItem.preferences.join(", ") : "None"}`);
    y += 8;

    writeTitle("Summary");
    writeBody(activeItem.plan.summary);
    writeBody(`Daily calories: ${activeItem.plan.daily_calories}`);
    writeBody(`Hydration: ${activeItem.plan.hydration_liters} L`);
    y += 8;

    writeTitle("Meal Plan");
    activeItem.plan.meals.forEach((meal, idx) => {
      writeBody(`${idx + 1}. ${meal.name}${meal.time ? ` (${meal.time})` : ""}`);
      writeList(meal.items);
      if (meal.notes) writeBody(`Note: ${meal.notes}`);
      y += 4;
    });

    writeTitle("Avoid / Limit");
    writeList(activeItem.plan.avoid);
    y += 6;

    writeTitle("Practical Tips");
    writeList(activeItem.plan.tips);
    y += 6;

    if (activeItem.plan.kada_recipe) {
      writeTitle(activeItem.plan.kada_recipe.name);
      writeBody(`Purpose: ${activeItem.plan.kada_recipe.purpose}`);
      writeBody("Ingredients:");
      writeList(activeItem.plan.kada_recipe.ingredients);
      writeBody("Preparation:");
      activeItem.plan.kada_recipe.preparation_steps.forEach((step, i) => writeBody(`${i + 1}. ${step}`));
      writeBody(`When to take: ${activeItem.plan.kada_recipe.when_to_take}`);
      if (activeItem.plan.kada_recipe.cautions.length > 0) {
        writeBody("Cautions:");
        writeList(activeItem.plan.kada_recipe.cautions);
      }
    }

    doc.save(`diet-plan-${new Date(activeItem.created_at).toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {isDemoMode && (
        <div className="fixed inset-0 pointer-events-none z-0 border-8 border-[#2EC4B6]/20 transition-all duration-500" />
      )}
      <Header />

      <main className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter mb-1">
                AI Diet Plan
              </h1>
              <p className="text-sm text-slate-500">
                Generate a personalized meal plan from your profile and prescription history.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white text-xs font-semibold text-slate-600 shadow-sm">
              <BrainCircuit className="w-4 h-4 text-[#2EC4B6]" />
              Gemini-powered suggestions
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <section className="xl:col-span-4 bg-white/90 backdrop-blur-2xl rounded-[28px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <form className="space-y-5" onSubmit={onGenerate}>
                <div>
                  <label className="text-xs font-bold tracking-[0.12em] uppercase text-slate-500">Goal</label>
                  <select
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    {GOALS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold tracking-[0.12em] uppercase text-slate-500">
                    Preferences or restrictions
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                      value={preferencesInput}
                      onChange={(e) => setPreferencesInput(e.target.value)}
                      placeholder="e.g. vegetarian, low sodium"
                    />
                    <button
                      type="button"
                      onClick={addPreference}
                      className="px-4 py-3 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  {preferences.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preferences.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => removePreference(item)}
                          className="px-3 py-1.5 rounded-full border border-[#2EC4B6]/30 bg-[#EAF7F6] text-xs font-semibold text-[#0F3D3E]"
                        >
                          {item} ×
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-bold tracking-[0.12em] uppercase text-slate-500">Additional notes</label>
                  <textarea
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm min-h-[96px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Symptoms, food dislikes, timings, or routine notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canGenerate}
                  className="w-full py-3 rounded-xl bg-[#0F3D3E] text-white font-semibold hover:bg-[#124849] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Generating plan..." : "Generate diet plan"}
                </button>
              </form>
            </section>

            <section className="xl:col-span-8 space-y-6">
              {error ? (
                <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
              ) : null}

              {activeItem?.plan ? (
                <div className="bg-white/90 backdrop-blur-2xl rounded-[28px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-heading font-bold text-slate-900">Generated plan</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Droplets className="w-4 h-4 text-[#2EC4B6]" />
                        {activeItem.plan.hydration_liters} L hydration
                      </div>
                      <button
                        onClick={downloadPdf}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0F3D3E] text-white text-xs font-semibold hover:bg-[#124849]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{activeItem.plan.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-bold">Daily calories</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#0F3D3E]">{activeItem.plan.daily_calories}</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-bold">Meals planned</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#0F3D3E]">{activeItem.plan.meals.length}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-[0.12em] text-slate-500 font-bold">Meal breakdown</h3>
                    {activeItem.plan.meals.map((meal, idx) => (
                      <div key={`${meal.name}-${idx}`} className="p-4 rounded-2xl border border-slate-100 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-[#0F3D3E] font-semibold">
                            <Utensils className="w-4 h-4 text-[#2EC4B6]" />
                            <span>{meal.name}</span>
                          </div>
                          {meal.time ? <span className="text-xs text-slate-500">{meal.time}</span> : null}
                        </div>
                        <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                          {meal.items.map((item, itemIdx) => (
                            <li key={`${item}-${itemIdx}`}>{item}</li>
                          ))}
                        </ul>
                        {meal.notes ? <p className="text-xs text-slate-500 mt-2">{meal.notes}</p> : null}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/70">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700">
                        <WheatOff className="w-4 h-4" />
                        Avoid / limit
                      </h3>
                      <ul className="mt-2 text-sm text-amber-800 list-disc pl-5 space-y-1">
                        {activeItem.plan.avoid.map((item, idx) => (
                          <li key={`${item}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/70">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                        <Sparkles className="w-4 h-4" />
                        Practical tips
                      </h3>
                      <ul className="mt-2 text-sm text-emerald-800 list-disc pl-5 space-y-1">
                        {activeItem.plan.tips.map((item, idx) => (
                          <li key={`${item}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {activeItem.plan.kada_recipe ? (
                    <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/60 space-y-2">
                      <h3 className="text-sm font-bold text-rose-700">
                        {activeItem.plan.kada_recipe.name}
                      </h3>
                      <p className="text-sm text-rose-800">{activeItem.plan.kada_recipe.purpose}</p>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-700">Ingredients</p>
                        <ul className="mt-1 text-sm text-rose-800 list-disc pl-5 space-y-1">
                          {activeItem.plan.kada_recipe.ingredients.map((item, idx) => (
                            <li key={`${item}-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-700">Preparation</p>
                        <ol className="mt-1 text-sm text-rose-800 list-decimal pl-5 space-y-1">
                          {activeItem.plan.kada_recipe.preparation_steps.map((item, idx) => (
                            <li key={`${item}-${idx}`}>{item}</li>
                          ))}
                        </ol>
                      </div>
                      <p className="text-sm text-rose-900">
                        <span className="font-semibold">When to take:</span> {activeItem.plan.kada_recipe.when_to_take}
                      </p>
                      {activeItem.plan.kada_recipe.cautions.length > 0 ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-700">Cautions</p>
                          <ul className="mt-1 text-sm text-rose-800 list-disc pl-5 space-y-1">
                            {activeItem.plan.kada_recipe.cautions.map((item, idx) => (
                              <li key={`${item}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-white/80 rounded-[28px] p-8 border border-slate-100 text-sm text-slate-500">
                  Generate your first plan to see a personalized meal structure here.
                </div>
              )}

              <div className="bg-white/80 rounded-[28px] p-6 border border-slate-100">
                <h3 className="text-sm uppercase tracking-[0.12em] text-slate-500 font-bold mb-3">Recent plans</h3>
                {loadingHistory ? (
                  <p className="text-sm text-slate-500">Loading saved plans...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-500">No saved plans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-slate-100 hover:border-[#2EC4B6]/40 hover:bg-[#EAF7F6]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">{item.goal}</p>
                          <span className="text-xs text-slate-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.preferences.length > 0 ? item.preferences.join(", ") : "No extra preferences"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
