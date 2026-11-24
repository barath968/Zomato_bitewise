"use client";

import { useEffect, useState } from "react";

const LABELS = [
  { icon: "restaurant", label: "Food" },
  { icon: "ramen_dining", label: "Cuisines" },
  { icon: "flatware", label: "Spoon & fork" },
] as const;

export function BootLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % LABELS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, []);

  const current = LABELS[active];

  return (
    <div
      className="flex min-h-[52vh] w-full flex-col items-center justify-center px-4 py-16"
      role="status"
      aria-live="polite"
      aria-label="Loading BiteWise"
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-bw-border/60" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-bw-accent-bright border-r-bw-teal/70 [animation-duration:1.2s]" />
        <div className="absolute inset-3 animate-spin rounded-full border border-transparent border-b-bw-amber border-l-bw-accent-soft/50 [animation-direction:reverse] [animation-duration:1.8s]" />

        {/* Soft glow */}
        <div className="pointer-events-none absolute inset-6 rounded-full bg-bw-accent/15 blur-xl" />

        {/* Center icon */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-bw-surface shadow-card ring-1 ring-bw-border">
          <span
            key={current.icon}
            className="material-symbols-outlined animate-pulse text-[40px] text-bw-accent-bright"
          >
            {current.icon}
          </span>
        </div>

        {/* Orbiting mini icons */}
        <span className="material-symbols-outlined absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-[18px] text-bw-teal">
          restaurant
        </span>
        <span className="material-symbols-outlined absolute bottom-1 right-2 text-[18px] text-bw-amber">
          ramen_dining
        </span>
        <span className="material-symbols-outlined absolute bottom-1 left-2 text-[18px] text-bw-accent-soft">
          flatware
        </span>
      </div>

      <p className="mt-8 font-display text-sm font-semibold tracking-wide text-bw-text">
        Loading {current.label.toLowerCase()}…
      </p>
      <p className="mt-2 text-center text-xs text-bw-muted">
        Connecting to BiteWise · fetching localities & cuisines
      </p>

      <div className="mt-5 flex items-center gap-2">
        {LABELS.map((item, i) => (
          <span
            key={item.icon}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              i === active
                ? "w-4 bg-bw-accent-bright"
                : "bg-bw-high"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
