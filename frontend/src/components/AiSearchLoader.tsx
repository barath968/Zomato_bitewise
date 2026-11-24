"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "travel_explore", label: "Searching venues" },
  { icon: "auto_awesome", label: "AI ranking matches" },
  { icon: "restaurant", label: "Crafting explanations" },
] as const;

export function AiSearchLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  const current = STEPS[active];

  return (
    <div
      className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-bw-border bg-bw-surface/80 px-4 py-12 shadow-card"
      role="status"
      aria-live="polite"
      aria-label="AI search in progress"
    >
      <div className="relative flex h-32 w-32 items-center justify-center md:h-36 md:w-36">
        <div className="absolute inset-0 rounded-full border-2 border-bw-border/60" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-bw-accent-bright border-r-bw-teal/70 [animation-duration:1.1s]" />
        <div className="absolute inset-3 animate-spin rounded-full border border-transparent border-b-bw-amber border-l-bw-accent-soft/50 [animation-direction:reverse] [animation-duration:1.7s]" />
        <div className="pointer-events-none absolute inset-5 rounded-full bg-bw-accent/15 blur-xl" />

        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-bw-surface shadow-card ring-1 ring-bw-border md:h-20 md:w-20">
          <span
            key={current.icon}
            className="material-symbols-outlined animate-pulse text-[34px] text-bw-accent-bright md:text-[40px]"
          >
            {current.icon}
          </span>
        </div>

        <span className="material-symbols-outlined absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-[16px] text-bw-teal">
          travel_explore
        </span>
        <span className="material-symbols-outlined absolute bottom-1 right-2 text-[16px] text-bw-amber">
          auto_awesome
        </span>
        <span className="material-symbols-outlined absolute bottom-1 left-2 text-[16px] text-bw-accent-soft">
          restaurant
        </span>
      </div>

      <p className="mt-7 font-display text-sm font-bold tracking-wide text-bw-accent-soft md:text-base">
        AI Search
      </p>
      <p className="mt-2 font-display text-sm font-semibold text-bw-text">
        {current.label}…
      </p>
      <p className="mt-2 max-w-xs text-center text-xs text-bw-muted">
        Filtering Bangalore spots, then ranking with personalized explanations
      </p>

      <div className="mt-5 flex items-center gap-2">
        {STEPS.map((step, i) => (
          <span
            key={step.icon}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-4 bg-bw-accent-bright" : "w-1.5 bg-bw-high"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
