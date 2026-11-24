import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/ui/shine-border";

type Props = {
  title: string;
  message: string;
  detail?: string | null;
  contextLabel?: string;
  retryLabel?: string;
  onRetry?: () => void;
  onDryRunRetry?: () => void;
};

export function ErrorBanner({
  title,
  message,
  detail,
  contextLabel = "Recommendation engine",
  retryLabel = "Retry recommendation",
  onRetry,
  onDryRunRetry,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-bw-border bg-bw-surface p-5 shadow-card md:p-8">
      <ShineBorder
        borderWidth={1}
        duration={12}
        shineColor={["#E23744", "#ff535a", "#F59E0B"]}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-bw-accent-bright/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-bw-amber-bright/10 blur-2xl" />

      <div className="relative z-10 flex flex-col items-start gap-5 md:flex-row">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#1e2023] text-bw-accent-bright shadow-inner">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="h-auto rounded bg-bw-error-bg px-2 py-0.5 font-display text-[11px] font-bold text-[#ffdad6] hover:bg-bw-error-bg">
              Service interruption
            </Badge>
            <span className="font-display text-[11px] font-semibold text-bw-muted">
              {contextLabel}
            </span>
          </div>

          <h2 className="font-display text-xl font-bold tracking-tight text-bw-text md:text-[22px]">
            {title}
          </h2>
          <p className="max-w-3xl text-base leading-relaxed text-bw-muted">{message}</p>

          <div className="mt-1 flex flex-col items-start justify-between gap-3 rounded-lg bg-[#1e2023] p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3 text-bw-teal">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              <span className="text-sm text-bw-text">
                <strong>Detail:</strong>{" "}
                {detail || "Try again, or use dry-run fallback (rating-sorted)."}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onRetry ? (
              <Button
                type="button"
                onClick={onRetry}
                className="h-auto gap-2 rounded-lg bg-bw-accent-bright px-5 py-2.5 font-display text-sm font-semibold text-[#410007] shadow-md hover:bg-bw-accent-bright hover:brightness-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                {retryLabel}
              </Button>
            ) : null}
            {onDryRunRetry ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onDryRunRetry}
                className="h-auto gap-2 rounded-lg bg-bw-highest px-5 py-2.5 font-display text-sm font-semibold text-bw-text hover:bg-[#37393d]"
              >
                <span className="material-symbols-outlined text-[18px] text-bw-amber">
                  dataset
                </span>
                Fast heuristic mode (dry run)
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
