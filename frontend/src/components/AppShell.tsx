import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FoodDecorBackground } from "@/components/FoodDecorBackground";
import { ShineBorder } from "@/components/ui/shine-border";

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="relative min-h-screen bg-bw-bg text-bw-text">
      <FoodDecorBackground />
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-bw-border/60 bg-bw-surface/95 shadow-[0_1px_8px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 overflow-hidden px-4 md:px-8">
          <ShineBorder
            borderWidth={1}
            duration={16}
            shineColor={["#E23744", "#71D7CF", "#F59E0B"]}
            className="opacity-40"
          />

          <div className="relative z-[1] flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-bw-accent to-bw-accent-bright font-display text-base font-extrabold text-white shadow-[0_0_20px_rgba(226,55,68,0.35)]">
              B
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-bold leading-none tracking-tight text-bw-text">
                BiteWise
              </div>
              <div className="mt-1 text-xs leading-none text-bw-variant">
                Bangalore Dining Intelligence
              </div>
            </div>
          </div>

          <nav className="relative z-[1] hidden items-center gap-1 rounded-xl bg-[#1e2023] p-1 md:flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto rounded-lg bg-bw-highest px-4 py-2 font-display text-base font-semibold text-bw-accent-soft hover:bg-bw-highest hover:text-bw-accent-soft"
            >
              <span className="text-lg leading-none">Hi</span>
              <span className="text-xl leading-none" aria-hidden>
                👋
              </span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-[1] mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 pb-10 pt-24 md:px-8">
        {children}
      </main>

      <footer className="relative z-[1] border-t border-bw-border bg-[#0c0e11]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-bw-muted sm:flex-row md:px-8">
          <span>© BiteWise AI · Urban Culinary Intelligence</span>
          <div className="flex flex-wrap items-center gap-4">
            <Badge
              variant="outline"
              className="h-auto border-bw-border bg-transparent px-2.5 py-0.5 font-display text-[11px] font-semibold text-bw-muted"
            >
              Bangalore Venue
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
