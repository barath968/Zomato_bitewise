"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/ui/shine-border";
import { Textarea } from "@/components/ui/textarea";
import type { BudgetLevel, OptionsResponse, RecommendRequest } from "@/lib/types";

type Props = {
  options: OptionsResponse;
  busy: boolean;
  onSubmit: (body: RecommendRequest) => void;
};

const BUDGET_META: Record<
  BudgetLevel,
  { label: string; hint: string; short: string }
> = {
  // Hints must match preprocess budget_bucket cutoffs (<500 / 500–1000 / >1000).
  low: { label: "Low", hint: "under ₹500", short: "Low tier" },
  medium: { label: "Medium", hint: "₹500–1k", short: "Mid tier" },
  high: { label: "High", hint: "₹1k+", short: "High tier" },
};

const DEFAULT_BUDGET_LABELS: Record<string, string> = {
  low: "Low · under ₹500 for two",
  medium: "Medium · ₹500–1,000 for two",
  high: "High · ₹1,000+ for two",
};

const CUISINE_CHIP_LIMIT = 8;

export function PreferenceForm({ options, busy, onSubmit }: Props) {
  const budgetLabels = { ...DEFAULT_BUDGET_LABELS, ...options.budget_labels };
  const [location, setLocation] = useState(options.locations[0] || options.city_option);
  const [budget, setBudget] = useState<BudgetLevel>("medium");
  const [cuisine, setCuisine] = useState(options.cuisines[0] || options.any_cuisine);
  const [minRating, setMinRating] = useState(4.0);
  const [topK, setTopK] = useState(Math.min(5, options.top_k_max));
  const [prefsText, setPrefsText] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [cuisineShowAll, setCuisineShowAll] = useState(false);
  const [locationQuery, setLocationQuery] = useState(location);
  const [locationOpen, setLocationOpen] = useState(false);
  const [cuisineQuery, setCuisineQuery] = useState("");
  const localityBoxRef = useRef<HTMLDivElement | null>(null);

  const allCuisines = options.cuisines;

  useEffect(() => {
    if (!locationOpen) setLocationQuery(location);
  }, [location, locationOpen]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!localityBoxRef.current?.contains(event.target as Node)) {
        setLocationOpen(false);
        setLocationQuery(location);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [location]);

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q || q === location.toLowerCase()) return options.locations;
    return options.locations.filter((loc) => loc.toLowerCase().includes(q));
  }, [options.locations, locationQuery, location]);

  const filteredCuisines = useMemo(() => {
    const q = cuisineQuery.trim().toLowerCase();
    if (!q) return allCuisines;
    return allCuisines.filter((c) => c.toLowerCase().includes(q));
  }, [allCuisines, cuisineQuery]);

  const isCuisineSearching = cuisineQuery.trim().length > 0;
  const hasMoreCuisines =
    !isCuisineSearching && filteredCuisines.length > CUISINE_CHIP_LIMIT;

  const cuisineChips = useMemo(() => {
    const source = filteredCuisines;
    const limit =
      cuisineShowAll || isCuisineSearching ? source.length : CUISINE_CHIP_LIMIT;
    const list = source.slice(0, limit);
    if (cuisine && !list.includes(cuisine) && !isCuisineSearching) {
      return [cuisine, ...list.filter((c) => c !== cuisine)];
    }
    return list;
  }, [filteredCuisines, cuisine, cuisineShowAll, isCuisineSearching]);

  return (
    <form
      className="relative min-h-[640px] w-full overflow-hidden rounded-xl border border-bw-border bg-bw-surface p-7 shadow-card md:min-h-[720px] md:p-9"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          location,
          budget,
          cuisine,
          min_rating: minRating,
          top_k: topK,
          additional_preferences: prefsText.trim(),
          dry_run: dryRun,
        });
      }}
    >
      <ShineBorder
        borderWidth={1}
        duration={12}
        shineColor={["#E23744", "#F59E0B", "#71D7CF"]}
      />
      <div className="absolute inset-x-0 top-0 z-[1] h-1 bg-gradient-to-r from-bw-accent-bright via-bw-amber-bright to-bw-teal-deep" />

      <div className="relative z-[1] mb-5">
        <h2 className="font-display text-xl font-bold tracking-tight text-bw-text md:text-2xl">
          Preference engine
        </h2>
      </div>

      <div className="relative z-[1] flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="localityCombobox"
              className="gap-1.5 font-display text-xs font-semibold text-bw-text"
            >
              <span className="material-symbols-outlined text-[16px] text-bw-accent-bright">
                location_on
              </span>
              Bangalore localities
            </Label>
            <div className="relative" ref={localityBoxRef}>
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[18px] text-bw-muted">
                search
              </span>
              <Input
                id="localityCombobox"
                role="combobox"
                aria-expanded={locationOpen}
                aria-controls="locality-listbox"
                aria-autocomplete="list"
                value={locationQuery}
                onFocus={() => setLocationOpen(true)}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setLocationOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setLocationOpen(false);
                    setLocationQuery(location);
                  }
                  if (e.key === "Enter" && filteredLocations[0]) {
                    e.preventDefault();
                    setLocation(filteredLocations[0]);
                    setLocationQuery(filteredLocations[0]);
                    setLocationOpen(false);
                  }
                }}
                placeholder="Search or pick a locality…"
                className="h-11 rounded-lg border-bw-border bg-[#1e2023] pl-10 pr-10 text-sm text-bw-text placeholder:text-bw-placeholder focus-visible:border-bw-accent-bright focus-visible:ring-bw-accent/30 dark:bg-[#1e2023]"
              />
              <button
                type="button"
                aria-label={locationOpen ? "Close localities" : "Open localities"}
                onClick={() => setLocationOpen((open) => !open)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-bw-muted hover:bg-bw-high hover:text-bw-text"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {locationOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {locationOpen ? (
                <ul
                  id="locality-listbox"
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-bw-border bg-[#1e2023] py-1 shadow-card"
                >
                  {filteredLocations.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-bw-muted">
                      No localities match “{locationQuery.trim()}”
                    </li>
                  ) : (
                    filteredLocations.map((loc) => {
                      const selected = loc === location;
                      return (
                        <li key={loc} role="option" aria-selected={selected}>
                          <button
                            type="button"
                            onClick={() => {
                              setLocation(loc);
                              setLocationQuery(loc);
                              setLocationOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-bw-high ${
                              selected
                                ? "bg-bw-high/80 font-semibold text-bw-accent-soft"
                                : "text-bw-text"
                            }`}
                          >
                            {selected ? (
                              <span className="material-symbols-outlined text-[16px] text-bw-accent-soft">
                                check
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[16px] text-bw-muted">
                                location_on
                              </span>
                            )}
                            <span className="truncate">{loc}</span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="gap-1.5 font-display text-xs font-semibold text-bw-text">
                <span className="material-symbols-outlined text-[16px] text-bw-amber">
                  payments
                </span>
                Budget for two
              </Label>
              <span className="font-display text-[11px] font-bold text-bw-muted">
                {BUDGET_META[budget].short}
              </span>
            </div>
            <div className="grid h-11 grid-cols-3 items-center gap-1 rounded-lg bg-[#1e2023] p-1">
              {(["low", "medium", "high"] as BudgetLevel[]).map((b) => {
                const active = budget === b;
                return (
                  <Button
                    key={b}
                    type="button"
                    variant="ghost"
                    onClick={() => setBudget(b)}
                    title={budgetLabels[b]}
                    className={`flex h-full flex-col items-center justify-center rounded-md font-display text-[11px] font-bold ${
                      active
                        ? "bg-bw-highest text-bw-accent-soft shadow-sm hover:bg-bw-highest hover:text-bw-accent-soft"
                        : "text-bw-muted hover:bg-transparent hover:text-bw-text"
                    }`}
                  >
                    <span>{BUDGET_META[b].label}</span>
                    <span className="text-[10px] font-semibold opacity-80">
                      {BUDGET_META[b].hint}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="cuisineSearch"
            className="gap-1.5 font-display text-xs font-semibold text-bw-text"
          >
            <span className="material-symbols-outlined text-[16px] text-bw-teal">
              restaurant_menu
            </span>
            Cuisine
          </Label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[18px] text-bw-muted">
              search
            </span>
            <Input
              id="cuisineSearch"
              value={cuisineQuery}
              onChange={(e) => {
                setCuisineQuery(e.target.value);
                if (e.target.value.trim()) setCuisineShowAll(true);
              }}
              placeholder="Search cuisine…"
              className="h-10 rounded-lg border-bw-border bg-[#1e2023] pl-10 pr-3 text-sm text-bw-text placeholder:text-bw-placeholder focus-visible:border-bw-accent-bright focus-visible:ring-bw-accent/30 dark:bg-[#1e2023]"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {cuisineChips.length === 0 ? (
              <p className="text-xs text-bw-muted">No cuisines match “{cuisineQuery.trim()}”.</p>
            ) : (
              cuisineChips.map((c) => {
                const selected = cuisine === c;
                return (
                  <Button
                    key={c}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCuisine(c);
                      setCuisineQuery("");
                      setCuisineShowAll(false);
                    }}
                    className={`h-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-semibold ${
                      selected
                        ? "bg-bw-accent-bright/20 text-bw-text ring-1 ring-bw-accent hover:bg-bw-accent-bright/20 hover:text-bw-text"
                        : "bg-[#1e2023] text-bw-muted hover:bg-[#1e2023] hover:text-bw-text"
                    }`}
                  >
                    {selected ? (
                      <span className="material-symbols-outlined text-[16px] text-bw-accent-soft">
                        check
                      </span>
                    ) : null}
                    <span>{c}</span>
                  </Button>
                );
              })
            )}
            {hasMoreCuisines ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCuisineShowAll((open) => !open)}
                className="h-auto inline-flex items-center gap-1 rounded-full border border-dashed border-bw-border bg-transparent px-3 py-1.5 font-display text-xs font-semibold text-bw-teal hover:border-bw-accent hover:bg-bw-high/40 hover:text-bw-accent-soft"
              >
                <span>{cuisineShowAll ? "Show less" : "View more"}</span>
                <span className="material-symbols-outlined text-[16px]">
                  {cuisineShowAll ? "expand_less" : "expand_more"}
                </span>
              </Button>
            ) : null}
          </div>
          {isCuisineSearching ? (
            <p className="text-xs text-bw-muted">
              {filteredCuisines.length === 1
                ? "1 match"
                : `${filteredCuisines.length} matches`}{" "}
              · selected: {cuisine}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 items-center gap-5 rounded-xl bg-[#1e2023] p-4 md:grid-cols-12">
          <div className="flex flex-col gap-2 md:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="gap-1 font-display text-xs font-semibold text-bw-text">
                <span className="material-symbols-outlined filled text-[16px] text-bw-amber">
                  star
                </span>
                Rating
              </Label>
              <Badge
                variant="secondary"
                className="h-auto rounded bg-bw-high px-2 py-0.5 font-display text-xs font-bold text-bw-amber hover:bg-bw-high"
              >
                {minRating.toFixed(1)}★
              </Badge>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bw-highest accent-bw-accent-bright"
            />
            <div className="flex justify-between font-display text-[11px] font-semibold text-bw-muted">
              <span>0</span>
              <span>3.5 decent</span>
              <span>4.5 elite</span>
              <span>5</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="gap-1 font-display text-xs font-semibold text-bw-text">
                <span className="material-symbols-outlined text-[16px] text-bw-teal">
                  format_list_numbered
                </span>
                Top K results
              </Label>
              <Badge
                variant="secondary"
                className="h-auto rounded bg-bw-high px-2 py-0.5 font-display text-xs font-bold text-bw-teal hover:bg-bw-high"
              >
                {topK}
              </Badge>
            </div>
            <input
              type="range"
              min={options.top_k_min}
              max={options.top_k_max}
              step={1}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-bw-highest accent-bw-accent-bright"
            />
            <div className="flex justify-between font-display text-[11px] font-semibold text-bw-muted">
              <span>{options.top_k_min}</span>
              <span>venues</span>
              <span>{options.top_k_max}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="promptPreferences"
              className="gap-1.5 font-display text-xs font-semibold text-bw-text"
            >
              <span className="material-symbols-outlined text-[16px] text-bw-teal">
                psychology
              </span>
              Natural language nuance & vibes
            </Label>
            <span className="font-display text-[11px] font-bold text-bw-muted">
              Optional
            </span>
          </div>
          <Textarea
            id="promptPreferences"
            rows={3}
            value={prefsText}
            onChange={(e) => setPrefsText(e.target.value)}
            placeholder="e.g. family-friendly, quiet ambience, craft beer, quick service"
            className="min-h-[84px] resize-none rounded-lg border-bw-border bg-[#1e2023] p-3 text-sm text-bw-text placeholder:text-bw-placeholder focus-visible:border-bw-accent-bright focus-visible:ring-bw-accent/30 dark:bg-[#1e2023]"
          />
        </div>

        <Label className="gap-2 text-sm font-normal text-bw-muted">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="h-[18px] w-[18px] accent-bw-accent"
          />
          Offline Search
        </Label>

        <div className="flex flex-col gap-4 pt-1">
          <p className="flex items-start gap-2 text-xs text-bw-muted">
            <span className="material-symbols-outlined text-[18px] text-bw-amber">
              bolt
            </span>
            <span>
              <span className="block font-display text-[11px] font-bold uppercase tracking-wider text-bw-accent-soft">
                Top recommendation preview
              </span>
              Submit preferences to see ranked recommendations with AI
              explanations.
            </span>
          </p>
          <Button
            type="submit"
            disabled={busy}
            size="lg"
            className="h-12 w-full gap-2 rounded-xl bg-bw-accent-bright px-6 font-display text-sm font-semibold text-[#5b000e] shadow-lg hover:bg-bw-accent-bright hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            <span>{busy ? "Filtering · Asking AI…" : "Get AI Recommendations"}</span>
            <span className="material-symbols-outlined text-[18px]">
              {busy ? "progress_activity" : "arrow_forward"}
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}
