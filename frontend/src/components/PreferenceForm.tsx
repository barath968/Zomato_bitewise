"use client";

import { useMemo, useState } from "react";

import type { BudgetLevel, OptionsResponse, RecommendRequest } from "@/lib/types";

type Props = {
  options: OptionsResponse;
  busy: boolean;
  onSubmit: (body: RecommendRequest) => void;
};

const BUDGET_META: Record<
  BudgetLevel,
  { label: string; hint: string; short: string }
> = {
  low: { label: "Low", hint: "₹300–600", short: "Low tier" },
  medium: { label: "Medium", hint: "₹700–1.5k", short: "Mid tier" },
  high: { label: "High", hint: "₹1.8k+", short: "High tier" },
};

const DEFAULT_BUDGET_LABELS: Record<string, string> = {
  low: "Low · under ₹500 for two",
  medium: "Medium · ₹500–1,000 for two",
  high: "High · ₹1,000+ for two",
};

export function PreferenceForm({ options, busy, onSubmit }: Props) {
  const budgetLabels = { ...DEFAULT_BUDGET_LABELS, ...options.budget_labels };
  const [location, setLocation] = useState(options.locations[0] || options.city_option);
  const [budget, setBudget] = useState<BudgetLevel>("medium");
  const [cuisine, setCuisine] = useState(options.cuisines[0] || options.any_cuisine);
  const [minRating, setMinRating] = useState(4.0);
  const [topK, setTopK] = useState(Math.min(5, options.top_k_max));
  const [prefsText, setPrefsText] = useState("");
  const [dryRun, setDryRun] = useState(false);

  const cuisineChips = useMemo(() => {
    const list = options.cuisines.slice(0, 14);
    if (!list.includes(cuisine) && cuisine) return [cuisine, ...list].slice(0, 14);
    return list;
  }, [options.cuisines, cuisine]);

  return (
    <form
      className="relative overflow-hidden rounded-xl border border-bw-border bg-bw-surface p-5 shadow-card md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          location,
          budget,
          cuisine,
          min_rating: minRating,
          top_k: topK,
          additional_preferences: prefsText.trim(),
          dry_run: dryRun,
        });
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-bw-accent-bright via-bw-amber-bright to-bw-teal-deep" />

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-bw-text">
            Preference engine
          </h2>
        </div>
        <span className="hidden rounded-full bg-bw-high px-2.5 py-1 font-display text-[11px] font-bold text-bw-accent-soft sm:inline">
          Interactive
        </span>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="localitySelect"
                className="flex items-center gap-1.5 font-display text-xs font-semibold text-bw-text"
              >
                <span className="material-symbols-outlined text-[16px] text-bw-accent-bright">
                  location_on
                </span>
                Bangalore localities
              </label>
              <span className="font-display text-[11px] font-bold text-bw-teal">
                Geo-weighted
              </span>
            </div>
            <div className="relative">
              <select
                id="localitySelect"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-bw-border bg-[#1e2023] px-3.5 pr-10 text-sm text-bw-text outline-none focus:border-bw-accent-bright"
              >
                {options.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-bw-muted">
                expand_more
              </span>
            </div>
            <p className="text-xs text-bw-muted">
              Hard filter on locality before AI ranking
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-bw-text">
                <span className="material-symbols-outlined text-[16px] text-bw-amber">
                  payments
                </span>
                Budget for two
              </span>
              <span className="font-display text-[11px] font-bold text-bw-muted">
                {BUDGET_META[budget].short}
              </span>
            </div>
            <div className="grid h-11 grid-cols-3 items-center gap-1 rounded-lg bg-[#1e2023] p-1">
              {(["low", "medium", "high"] as BudgetLevel[]).map((b) => {
                const active = budget === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`flex h-full flex-col items-center justify-center rounded-md font-display text-[11px] font-bold transition ${
                      active
                        ? "bg-bw-highest text-bw-accent-soft shadow-sm"
                        : "text-bw-muted hover:text-bw-text"
                    }`}
                    title={budgetLabels[b]}
                  >
                    <span>{BUDGET_META[b].label}</span>
                    <span className="text-[10px] font-semibold opacity-80">
                      {BUDGET_META[b].hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 font-display text-xs font-semibold text-bw-text">
            <span className="material-symbols-outlined text-[16px] text-bw-teal">
              restaurant_menu
            </span>
            Cuisine
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {cuisineChips.map((c) => {
              const selected = cuisine === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuisine(c)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-semibold transition ${
                    selected
                      ? "bg-bw-accent-bright/20 text-bw-text ring-1 ring-bw-accent"
                      : "bg-[#1e2023] text-bw-muted hover:text-bw-text"
                  }`}
                >
                  {selected ? (
                    <span className="material-symbols-outlined text-[16px] text-bw-accent-soft">
                      check
                    </span>
                  ) : null}
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-5 rounded-xl bg-[#1e2023] p-4 md:grid-cols-12">
          <div className="flex flex-col gap-2 md:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-display text-xs font-semibold text-bw-text">
                <span className="material-symbols-outlined filled text-[16px] text-bw-amber">
                  star
                </span>
                Rating
              </span>
              <span className="inline-flex items-center gap-1.5 rounded bg-bw-high px-2 py-0.5">
                <span className="font-display text-xs font-bold text-bw-amber">
                  {minRating.toFixed(1)}★
                </span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bw-highest accent-bw-accent-bright"
            />
            <div className="flex justify-between font-display text-[11px] font-semibold text-bw-muted">
              <span>0</span>
              <span>3.5 decent</span>
              <span>4.5 elite</span>
              <span>5</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-display text-xs font-semibold text-bw-text">
                <span className="material-symbols-outlined text-[16px] text-bw-teal">
                  format_list_numbered
                </span>
                Top K results
              </span>
              <span className="inline-flex items-center gap-1.5 rounded bg-bw-high px-2 py-0.5">
                <span className="font-display text-xs font-bold text-bw-teal">
                  {topK}
                </span>
              </span>
            </div>
            <input
              type="range"
              min={options.top_k_min}
              max={options.top_k_max}
              step={1}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bw-highest accent-bw-accent-bright"
            />
            <div className="flex justify-between font-display text-[11px] font-semibold text-bw-muted">
              <span>{options.top_k_min}</span>
              <span>venues</span>
              <span>{options.top_k_max}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="promptPreferences"
              className="flex items-center gap-1.5 font-display text-xs font-semibold text-bw-text"
            >
              <span className="material-symbols-outlined text-[16px] text-bw-teal">
                psychology
              </span>
              Natural language nuance & vibes
            </label>
            <span className="font-display text-[11px] font-bold text-bw-muted">
              Optional
            </span>
          </div>
          <div className="relative">
            <textarea
              id="promptPreferences"
              rows={3}
              value={prefsText}
              onChange={(e) => setPrefsText(e.target.value)}
              placeholder="e.g. family-friendly, quiet ambience, craft beer, quick service"
              className="w-full resize-none rounded-lg border border-bw-border bg-[#1e2023] p-3 text-sm text-bw-text outline-none placeholder:text-bw-placeholder focus:border-bw-accent-bright"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-bw-muted">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="h-[18px] w-[18px] accent-bw-accent"
          />
          Offline Search
        </label>

        <div className="flex flex-col items-stretch justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <p className="flex items-start gap-2 text-xs text-bw-muted sm:max-w-sm">
            <span className="material-symbols-outlined text-[18px] text-bw-amber">
              bolt
            </span>
            <span>
              <span className="block font-display text-[11px] font-bold uppercase tracking-wider text-bw-accent-soft">
                Top recommendation preview
              </span>
              Submit preferences to see ranked recommendations with AI
              explanations.
            </span>
          </p>
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-bw-accent-bright px-6 font-display text-sm font-semibold text-[#5b000e] shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <span>{busy ? "Filtering · Asking AI…" : "Get AI Recommendations"}</span>
            <span className="material-symbols-outlined text-[18px]">
              {busy ? "progress_activity" : "arrow_forward"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
