"use client";

import type { BudgetLevel, OptionsResponse, RecommendRequest } from "@/lib/types";

type Props = {
  options: OptionsResponse;
  busy: boolean;
  onSubmit: (body: RecommendRequest) => void;
};

const DEFAULT_BUDGET_LABELS: Record<string, string> = {
  low: "Low · under ₹500 for two",
  medium: "Medium · ₹500–1,000 for two",
  high: "High · ₹1,000+ for two",
};

export function PreferenceForm({ options, busy, onSubmit }: Props) {
  const budgetLabels = { ...DEFAULT_BUDGET_LABELS, ...options.budget_labels };

  return (
    <form
      className="relative overflow-hidden rounded-2xl border border-bw-border bg-bw-surface p-5 shadow-xl md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          location: String(fd.get("location") || options.city_option),
          budget: String(fd.get("budget") || "medium") as BudgetLevel,
          cuisine: String(fd.get("cuisine") || options.any_cuisine),
          min_rating: Number(fd.get("min_rating") || 4),
          top_k: Number(fd.get("top_k") || 5),
          additional_preferences: String(fd.get("additional_preferences") || "").trim(),
          dry_run: fd.get("dry_run") === "on",
        });
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-bw-accent via-[#ee9800] to-[#32a099]" />
      <h2 className="font-display text-base font-semibold text-bw-text">Preference engine</h2>
      <p className="mb-5 mt-1 text-sm text-bw-muted">Hard filters first · AI ranking second</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wide text-bw-text">
            Bangalore locality
          </span>
          <select
            name="location"
            defaultValue={options.locations[0]}
            className="h-11 rounded-lg border border-bw-border bg-bw-elevated px-3 text-sm text-bw-text outline-none focus:border-bw-accent"
          >
            {options.locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wide text-bw-text">
            Budget for two
          </span>
          <select
            name="budget"
            defaultValue="medium"
            className="h-11 rounded-lg border border-bw-border bg-bw-elevated px-3 text-sm text-bw-text outline-none focus:border-bw-accent"
          >
            {(["low", "medium", "high"] as BudgetLevel[]).map((b) => (
              <option key={b} value={b}>
                {budgetLabels[b] || b}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wide text-bw-text">
            Cuisine
          </span>
          <select
            name="cuisine"
            defaultValue={options.cuisines[0]}
            className="h-11 rounded-lg border border-bw-border bg-bw-elevated px-3 text-sm text-bw-text outline-none focus:border-bw-accent"
          >
            {options.cuisines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-display text-xs font-semibold uppercase tracking-wide text-bw-text">
            Minimum rating
          </span>
          <input
            name="min_rating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            defaultValue={4}
            className="h-11 rounded-lg border border-bw-border bg-bw-elevated px-3 text-sm text-bw-text outline-none focus:border-bw-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="font-display text-xs font-semibold uppercase tracking-wide text-bw-text">
            Top K recommendations ({options.top_k_min}–{options.top_k_max})
          </span>
          <input
            name="top_k"
            type="number"
            min={options.top_k_min}
            max={options.top_k_max}
            defaultValue={Math.min(5, options.top_k_max)}
            className="h-11 rounded-lg border border-bw-border bg-bw-elevated px-3 text-sm text-bw-text outline-none focus:border-bw-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="font-display text-xs font-semibold uppercase tracking-wide text-bw-text">
            Additional preferences (optional)
          </span>
          <textarea
            name="additional_preferences"
            rows={3}
            placeholder="e.g. family-friendly, quiet ambience, craft beer, quick service"
            className="rounded-lg border border-bw-border bg-bw-elevated px-3 py-2 text-sm text-bw-text outline-none placeholder:text-bw-placeholder focus:border-bw-accent"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-bw-muted">
        <input name="dry_run" type="checkbox" className="accent-bw-accent" />
        Dry run (skip Groq, use rating-sorted explanations)
      </label>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-bw-accent font-display text-sm font-semibold text-white transition hover:bg-bw-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Filtering matches · Asking the AI…" : "Get recommendations"}
      </button>
    </form>
  );
}
