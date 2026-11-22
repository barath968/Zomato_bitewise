import { costLabel } from "@/lib/api";
import type { RecommendationItem } from "@/lib/types";

type Props = {
  item: RecommendationItem;
  budgetLabels?: Record<string, string>;
};

export function RestaurantCard({ item, budgetLabels }: Props) {
  const tags = (item.cuisine || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
  const isTop = item.rank === 1;

  return (
    <article
      className={`rounded-2xl border bg-bw-surface p-5 ${
        isTop
          ? "border-bw-accent/40 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]"
          : "border-bw-border"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide ${
            isTop
              ? "bg-[#ff535a] text-[#5b000e]"
              : "border border-bw-border bg-bw-elevated text-bw-muted"
          }`}
        >
          Rank #{item.rank}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/12 px-3 py-1 font-display text-sm font-bold text-bw-amber">
          ★ {item.rating.toFixed(1)}
        </span>
      </div>

      <h3 className="font-display text-xl font-bold tracking-tight text-bw-text">
        {item.name}
      </h3>
      <div className="mt-2">
        <span className="inline-block rounded-md bg-bw-elevated px-2.5 py-1 font-display text-xs font-semibold text-bw-text">
          {costLabel(item.estimated_cost, budgetLabels)}
        </span>
      </div>

      <div className="mt-4 rounded-xl border-l-2 border-bw-accent bg-bw-elevated p-4">
        <div className="mb-1 font-display text-[11px] font-bold uppercase tracking-wider text-[#ffb3b1]">
          Why this fits
        </div>
        <p className="text-sm leading-relaxed text-bw-text">{item.explanation}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(tags.length ? tags : ["Cuisine n/a"]).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-bw-border bg-bw-elevated px-2.5 py-0.5 font-display text-[11px] font-semibold text-bw-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
