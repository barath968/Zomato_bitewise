type Props = {
  restaurantCount?: number | null;
  children: React.ReactNode;
};

export function AppShell({ restaurantCount, children }: Props) {
  const countLabel =
    restaurantCount != null
      ? `${restaurantCount.toLocaleString()} curated spots`
      : "connecting…";

  return (
    <div className="min-h-screen bg-bw-bg text-bw-text">
      <header className="border-b border-bw-border bg-bw-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-bw-accent to-[#ff535a] font-display text-base font-extrabold text-white">
              B
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight text-bw-text">
                BiteWise
              </div>
              <div className="text-xs text-[#e4bebc]">Bangalore AI Recommender</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-bw-high px-3 py-1 font-display text-[11px] font-bold text-bw-muted sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bw-teal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bw-teal" />
            </span>
            Bangalore · {countLabel} · AI Ranked
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-bw-border px-4 py-6 text-xs text-bw-muted md:px-8">
        <span>BiteWise AI · Urban culinary intelligence</span>
        <span>Indiranagar · Koramangala · Whitefield · CBD</span>
      </footer>
    </div>
  );
}
