export function LoadingState() {
  return (
    <div className="rounded-2xl border border-bw-border bg-bw-elevated p-5 md:p-6">
      <div className="font-display text-lg font-bold text-bw-text">
        Filtering matches · Asking the AI…
      </div>
      <p className="mt-1 text-sm text-bw-muted">
        Hard filters first, then ranking and explanations.
      </p>
      <div className="mt-4 space-y-3">
        <div className="h-[72px] animate-pulse rounded-lg bg-gradient-to-r from-bw-surface via-bw-high to-bw-surface bg-[length:200%_100%]" />
        <div className="h-[72px] animate-pulse rounded-lg bg-gradient-to-r from-bw-surface via-bw-high to-bw-surface bg-[length:200%_100%]" />
        <div className="h-[72px] animate-pulse rounded-lg bg-gradient-to-r from-bw-surface via-bw-high to-bw-surface bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
