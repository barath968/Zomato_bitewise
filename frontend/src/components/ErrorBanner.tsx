type Props = {
  title: string;
  message: string;
  detail?: string | null;
  onRetry?: () => void;
};

export function ErrorBanner({ title, message, detail, onRetry }: Props) {
  return (
    <div className="rounded-2xl border border-[#ffb4ab]/35 bg-gradient-to-b from-[rgba(147,0,10,0.35)] to-bw-surface px-6 py-8 text-center">
      <h2 className="font-display text-xl font-bold text-bw-text">{title}</h2>
      <div className="mx-auto mt-4 max-w-xl rounded-lg border border-[#ffb4ab]/30 bg-[rgba(147,0,10,0.25)] p-4 text-left">
        <strong className="block font-display text-[#ffb4ab]">{message}</strong>
        <span className="mt-1 block text-sm text-bw-muted">
          {detail || "Try again, or enable dry-run fallback."}
        </span>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 h-10 rounded-lg bg-bw-accent px-5 font-display text-sm font-semibold text-white hover:bg-bw-accent-hover"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
