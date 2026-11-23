import type { RecommendRequest, RecommendationResponse } from "@/lib/types";

type Props = {
  prefs: RecommendRequest;
  result: RecommendationResponse;
  budgetLabels?: Record<string, string>;
  onEdit?: () => void;
  onReset?: () => void;
};

export function FilterSummary({
  prefs,
  result,
  budgetLabels,
  onEdit,
  onReset,
}: Props) {
  const budget = budgetLabels?.[prefs.budget] || prefs.budget;
  const cuisine = prefs.cuisine || "Any cuisine";
  const meta = result.meta;

  return (
    <section className="mb-5 rounded-xl border border-bw-border bg-bw-surface p-4 shadow-md md:p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bw-high text-bw-accent-soft">
            <span className="material-symbols-outlined text-[22px]">tune</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-semibold text-bw-text">
                Active taste context
              </span>
              <span className="truncate text-sm text-bw-muted">
                {prefs.location} · {budget} · Min ★{prefs.min_rating.toFixed(1)}+ ·{" "}
                {cuisine}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-bw-teal">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                Showing {meta.returned_count} of {prefs.top_k} requested
              </span>
              <span className="text-bw-placeholder">/</span>
              <span className="text-bw-muted">
                Candidates {meta.candidate_count}
              </span>
            </div>
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
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end lg:self-center">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-full bg-bw-high px-3 py-1.5 font-display text-xs font-semibold text-bw-text shadow-sm transition hover:bg-[#37393d]"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit filters
            </button>
          ) : null}
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-full bg-[#1e2023] px-3 py-1.5 font-display text-xs font-semibold text-bw-muted transition hover:text-bw-text"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
