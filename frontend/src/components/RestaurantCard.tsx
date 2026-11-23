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
      className={`relative flex w-full flex-col gap-4 overflow-hidden rounded-2xl border bg-bw-surface p-5 shadow-card md:p-6 ${
        isTop ? "border-bw-accent/40" : "border-bw-border"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide ${
              isTop
                ? "bg-bw-accent-bright text-[#5b000e]"
                : "bg-bw-high text-bw-text"
            }`}
          >
            {isTop ? (
              <span className="material-symbols-outlined text-[13px]">
                military_tech
              </span>
            ) : null}
            Rank #{item.rank}
            {isTop ? " · Top AI match" : ""}
          </span>
          {tags[0] ? (
            <span className="rounded-full bg-[#1e2023] px-2.5 py-0.5 font-display text-[11px] font-semibold text-bw-teal">
              {tags[0]}
            </span>
          ) : null}
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-bw-amber/15 px-3 py-1 text-bw-amber shadow-sm">
          <span className="material-symbols-outlined filled text-[16px] text-bw-amber">
            star
          </span>
          <span className="font-display text-sm font-bold">{item.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight text-bw-text md:text-[22px]">
            {item.name}
          </h3>
          {tags.length > 1 ? (
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-bw-muted">
              <span className="material-symbols-outlined text-[16px] text-bw-accent-bright">
                restaurant
              </span>
              <span>{tags.slice(0, 3).join(" · ")}</span>
            </p>
          ) : null}
        </div>
        <span className="self-start rounded-md bg-[#1e2023] px-2.5 py-1 font-display text-xs font-semibold text-bw-text">
          {costLabel(item.estimated_cost, budgetLabels)}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-[#1e2023] p-4 shadow-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bw-accent-bright text-[#5b000e]">
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        </div>
        <div className="min-w-0">
          <div className="font-display text-xs font-semibold text-bw-accent-soft">
            AI Fit Rationale
          </div>
          <p className="mt-1 text-sm leading-relaxed text-bw-text">{item.explanation}</p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {(tags.length ? tags : ["Cuisine n/a"]).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-bw-highest px-2.5 py-1 font-display text-[11px] font-semibold text-bw-text"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
