type Props = {
  reason: string;
  suggestions: string[];
  onReset?: () => void;
};

export function EmptyState({ reason, suggestions, onReset }: Props) {
  const tips =
    suggestions.length > 0
      ? suggestions
      : ["Widen cuisine", "Lower min rating", "Change budget"];

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-xl border border-bw-border bg-[#1e2023] px-6 py-10 text-center shadow-card sm:px-12 sm:py-12">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-bw-accent-bright/10 blur-3xl" />

      <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-bw-high/60" />
        <span className="material-symbols-outlined relative z-10 text-[64px] text-bw-accent-bright">
          search_off
        </span>
      </div>

      <h2 className="relative font-display text-xl font-bold tracking-tight text-bw-text md:text-[22px]">
        No Bangalore spots match every strict filter
      </h2>
      <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed text-bw-muted">
        {reason}
      </p>

      <div className="relative mt-8 flex w-full flex-col items-center gap-2">
        <span className="mb-1 font-display text-[11px] font-bold uppercase tracking-wider text-bw-placeholder">
          Recommended adjustments
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tips.map((tip) => (
            <span
              key={tip}
              className="inline-flex items-center gap-1.5 rounded-full bg-bw-high px-3.5 py-1.5 font-display text-xs font-semibold text-bw-text"
            >
              <span className="material-symbols-outlined text-[16px] text-bw-amber">
                bolt
              </span>
              {tip}
            </span>
          ))}
        </div>
      </div>

      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="relative mt-8 flex h-10 items-center justify-center gap-2 rounded-lg bg-bw-accent-bright px-5 font-display text-sm font-semibold text-[#5b000e] shadow-md transition hover:brightness-110"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          Reset results & edit filters
        </button>
      ) : null}
    </div>
  );
}
