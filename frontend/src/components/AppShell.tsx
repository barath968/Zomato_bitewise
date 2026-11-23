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
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-bw-border/60 bg-bw-surface/95 shadow-[0_1px_8px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-bw-accent to-bw-accent-bright font-display text-base font-extrabold text-white">
              B
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-bold leading-none tracking-tight text-bw-text">
                BiteWise
              </div>
              <div className="mt-1 text-xs leading-none text-bw-variant">
                Bangalore AI Recommender
              </div>
            </div>
            <div className="ml-2 hidden items-center gap-2 rounded-full bg-bw-high px-3 py-1 font-display text-[11px] font-bold text-bw-muted xl:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bw-teal opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-bw-teal" />
              </span>
              Bangalore · {countLabel} · AI Ranked
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-xl bg-[#1e2023] p-1 md:flex">
            <span className="rounded-lg bg-bw-highest px-3 py-1.5 font-display text-xs font-semibold text-bw-accent-soft">
              Search & Recommend
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 pb-10 pt-24 md:px-8">
        {children}
      </main>

      <footer className="border-t border-bw-border bg-[#0c0e11]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-bw-muted sm:flex-row md:px-8">
          <span>© BiteWise AI · Urban Culinary Intelligence</span>
          <div className="flex flex-wrap items-center gap-4">
            <span>Bangalore Venue</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
