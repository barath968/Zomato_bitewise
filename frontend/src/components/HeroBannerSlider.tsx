"use client";

import { useEffect, useState } from "react";

const BANNERS = [
  {
    id: "south-indian",
    title: "South Indian favourites",
    subtitle: "Dosa, filter coffee & local classics",
    image:
      "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "biryani",
    title: "Spice & biryani trails",
    subtitle: "Bold flavours across Bangalore kitchens",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "global",
    title: "Global dining scenes",
    subtitle: "Cafés, Asian plates & world cuisine",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
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
