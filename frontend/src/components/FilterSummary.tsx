import type { RecommendRequest, RecommendationResponse } from "@/lib/types";

type Props = {
  prefs: RecommendRequest;
  result: RecommendationResponse;
  budgetLabels?: Record<string, string>;
};

export function FilterSummary({ prefs, result, budgetLabels }: Props) {
  const budget = budgetLabels?.[prefs.budget] || prefs.budget;
  const cuisine = prefs.cuisine || "Any cuisine";
  const meta = result.meta;

  return (
    <div className="mb-5 rounded-2xl border border-bw-border bg-bw-surface p-4 md:p-5">
      <div className="font-display text-xs font-semibold text-bw-text">Active taste context</div>
      <p className="mt-1 text-sm text-bw-muted">
        {prefs.location} · {budget} · Min ★{prefs.min_rating.toFixed(1)}+ · {cuisine}
      </p>
      <p className="mt-1 text-xs text-bw-teal">
        Showing {meta.returned_count} of {prefs.top_k} requested · candidates{" "}
        {meta.candidate_count}
      </p>
      <div className="mt-2">
        {meta.source === "llm" ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-bw-high px-3 py-1 font-display text-[11px] font-bold text-bw-muted">
            <span className="h-2 w-2 rounded-full bg-bw-teal" />
            AI ranked
          </span>
        ) : meta.source === "empty" ? null : (
          <span className="inline-flex rounded-full border border-amber-500/35 bg-amber-500/12 px-2.5 py-0.5 font-display text-[11px] font-bold text-bw-amber">
            Degraded · {meta.source}
          </span>
        )}
      </div>
    </div>
  );
}
