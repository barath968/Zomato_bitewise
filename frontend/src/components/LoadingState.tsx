import { Badge } from "@/components/ui/badge";
import { ShineBorder } from "@/components/ui/shine-border";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-bw-border bg-[#1e2023] p-5 shadow-card md:p-6">
        <ShineBorder
          borderWidth={1}
          duration={10}
          shineColor={["#E23744", "#F59E0B", "#71D7CF"]}
        />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-bw-accent-soft/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-bw-high">
              <span className="absolute h-12 w-12 animate-ping rounded-xl bg-bw-accent-bright/20" />
              <span className="absolute h-8 w-8 animate-pulse rounded-lg bg-bw-accent-soft/30" />
              <span className="material-symbols-outlined relative z-10 animate-spin text-[28px] text-bw-accent-soft [animation-duration:4s]">
                radar
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="h-auto rounded-full bg-bw-accent-soft/20 px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide text-bw-accent-soft hover:bg-bw-accent-soft/20">
                  Inference active
                </Badge>
              </div>
              <h2 className="mt-1 font-display text-lg font-bold text-bw-text md:text-xl">
                Filtering matches · Asking the AI…
              </h2>
              <p className="mt-0.5 text-sm text-bw-muted">
                Hard filters first, then ranking and personalized explanations.
              </p>
            </div>
          </div>

          <div className="hidden flex-col items-end rounded-xl bg-[#0c0e11]/60 px-4 py-2.5 sm:flex">
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-bw-muted">
              Pipeline
            </span>
            <span className="font-display text-sm font-bold text-bw-amber">Live</span>
          </div>
        </div>

        <div className="relative z-10 mt-5 rounded-xl bg-[#0c0e11]/70 p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-bw-muted">
              Execution pipeline
            </span>
            <span className="flex items-center gap-1 font-display text-[11px] font-bold text-bw-teal">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bw-teal" />
              Step 2 of 3 active
            </span>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center gap-3 text-bw-text">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bw-teal/20 text-bw-teal">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </span>
              <span className="text-bw-muted line-through">
                Scanning Bangalore venues against hard filters…
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-bw-high/60 px-3 py-1.5 font-medium text-bw-text">
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-bw-accent-bright opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-bw-accent-soft" />
              </span>
              <span>Analyzing sentiment & ranking candidates…</span>
              <span className="ml-auto flex items-center gap-1 font-display text-[11px] font-bold text-bw-accent-soft">
                <span className="material-symbols-outlined animate-spin text-[14px]">
                  refresh
                </span>
                active
              </span>
            </div>
            <div className="flex items-center gap-3 text-bw-muted/70">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bw-high font-display text-[11px] font-bold">
                3
              </span>
              <span>Formulating personalized dining explanations…</span>
              <span className="ml-auto font-display text-[11px] font-bold text-bw-placeholder">
                queued
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4" aria-label="Loading recommendation skeletons">
        {[0, 1, 2].map((i) => (
          <article
            key={i}
            className="relative overflow-hidden rounded-2xl border border-bw-border bg-bw-surface p-5"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {i === 0 ? (
              <ShineBorder
                borderWidth={1}
                duration={14}
                shineColor={["#E23744", "#ff535a", "#F59E0B"]}
              />
            ) : null}
            <div className="relative z-[1] mb-3 flex items-center justify-between gap-4">
              <div className="flex w-3/5 items-center gap-2">
                <Skeleton className="shimmer h-6 w-3/4 rounded-md bg-bw-high" />
                <Skeleton className="shimmer h-4 w-16 rounded bg-bw-high" />
              </div>
              <Skeleton className="shimmer h-7 w-16 rounded-full bg-bw-high" />
            </div>
            <div className="relative z-[1] mb-4 flex items-center gap-2">
              <Skeleton className="shimmer h-3.5 w-28 rounded bg-bw-high" />
              <Skeleton className="shimmer h-3.5 w-20 rounded bg-bw-high" />
            </div>
            <div className="relative z-[1] mb-4 overflow-hidden rounded-xl bg-[#1e2023] p-4">
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-bw-accent/70" />
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-bw-accent/50" />
                <Skeleton className="shimmer h-3 w-24 rounded bg-bw-highest" />
              </div>
              <Skeleton className="shimmer mb-2 h-3 w-full rounded bg-bw-highest" />
              <Skeleton className="shimmer h-3 w-4/5 rounded bg-bw-highest" />
            </div>
            <div className="relative z-[1] flex gap-2">
              <Skeleton className="shimmer h-6 w-20 rounded-full bg-bw-high" />
              <Skeleton className="shimmer h-6 w-24 rounded-full bg-bw-high" />
              <Skeleton className="shimmer h-6 w-16 rounded-full bg-bw-high" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
