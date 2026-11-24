import { costLabel } from "@/lib/api";
import type { RecommendationItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShineBorder } from "@/components/ui/shine-border";

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
    <Card
      className={`relative gap-4 overflow-hidden border bg-bw-surface py-5 shadow-card ring-0 md:py-6 ${
        isTop
          ? "border-bw-accent/40 shadow-[0_0_0_1px_rgba(226,55,68,0.25)]"
          : "border-bw-border"
      }`}
    >
      {isTop ? (
        <ShineBorder
          borderWidth={1}
          duration={10}
          shineColor={["#E23744", "#ff535a", "#F59E0B"]}
        />
      ) : null}
      <CardHeader className="relative z-[1] gap-3 px-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                isTop
                  ? "h-auto rounded-full bg-bw-accent-bright px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide text-[#5b000e] hover:bg-bw-accent-bright"
                  : "h-auto rounded-full bg-bw-high px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide text-bw-text hover:bg-bw-high"
              }
            >
              {isTop ? (
                <span className="material-symbols-outlined text-[13px]">
                  military_tech
                </span>
              ) : null}
              Rank #{item.rank}
              {isTop ? " · Top AI match" : ""}
            </Badge>
            {tags[0] ? (
              <Badge
                variant="secondary"
                className="h-auto rounded-full bg-[#1e2023] px-2.5 py-0.5 font-display text-[11px] font-semibold text-bw-teal hover:bg-[#1e2023]"
              >
                {tags[0]}
              </Badge>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-bw-amber/15 px-3 py-1 text-bw-amber shadow-sm">
            <span className="material-symbols-outlined filled text-[16px] text-bw-amber">
              star
            </span>
            <span className="font-display text-sm font-bold">
              {item.rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
          <div>
            <CardTitle className="font-display text-xl font-bold tracking-tight text-bw-text md:text-[22px]">
              {item.name}
            </CardTitle>
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
      </CardHeader>

      <CardContent className="relative z-[1] px-5 md:px-6">
        <div className="flex items-start gap-3 rounded-xl bg-[#1e2023] p-4 shadow-sm">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bw-accent-bright text-[#5b000e]">
            <span className="material-symbols-outlined text-[18px]">
              auto_awesome
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-xs font-semibold text-bw-accent-soft">
              AI Fit Rationale
            </div>
            <p className="mt-1 text-sm leading-relaxed text-bw-text">
              {item.explanation}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-[1] px-5 pt-0 md:px-6">
        <div className="flex flex-wrap gap-1.5">
          {(tags.length ? tags : ["Cuisine n/a"]).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-auto rounded-full bg-bw-highest px-2.5 py-1 font-display text-[11px] font-semibold text-bw-text hover:bg-bw-highest"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
