"use client";

import { useEffect, useState } from "react";

const BANNERS = [
  {
    id: "fine-dining",
    title: "Fine dining rooms",
    subtitle: "Candlelit tables & chef-driven tasting menus",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "high-tier",
    title: "High-tier restaurants",
    subtitle: "Polished service & elevated Bangalore nights",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "global",
    title: "World cuisine plates",
    subtitle: "Sushi, noodles, pizza & global flavours",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

export function HeroBannerSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BANNERS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative ml-auto w-full max-w-sm overflow-hidden rounded-2xl border border-bw-border bg-bw-surface shadow-card md:max-w-md">
      <div className="relative h-40 w-full md:h-48">
        {BANNERS.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image}
              alt={banner.title}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bw-bg/90 via-bw-bg/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <p className="font-display text-base font-bold text-bw-text md:text-lg">
                {banner.title}
              </p>
              <p className="mt-0.5 text-xs text-bw-muted md:text-sm">
                {banner.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 md:bottom-4 md:right-4">
        {BANNERS.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`Show ${banner.title}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-5 bg-bw-accent-bright"
                : "w-1.5 bg-bw-text/40 hover:bg-bw-text/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
