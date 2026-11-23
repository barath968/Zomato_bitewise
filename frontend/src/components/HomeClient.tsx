"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchOptions, getApiBaseUrl, postRecommend } from "@/lib/api";
import type {
  OptionsResponse,
  RecommendRequest,
  RecommendationResponse,
} from "@/lib/types";

import { AppShell } from "./AppShell";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { FilterSummary } from "./FilterSummary";
import { LoadingState } from "./LoadingState";
import { PreferenceForm } from "./PreferenceForm";
import { RestaurantCard } from "./RestaurantCard";

type LoadState = "boot" | "ready" | "boot_error";

export function HomeClient() {
  const [boot, setBoot] = useState<LoadState>("boot");
  const [bootError, setBootError] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<RecommendRequest | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const loadOptions = useCallback(async () => {
    setBoot("boot");
    setBootError(null);
    try {
      const data = await fetchOptions();
      setOptions(data);
      setBoot("ready");
    } catch (err) {
      setBoot("boot_error");
      setBootError(
        err instanceof Error
          ? err.message
          : `Cannot reach API at ${getApiBaseUrl()}`,
      );
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const runRecommend = async (body: RecommendRequest) => {
    setBusy(true);
    setError(null);
    setPrefs(body);
    setResult(null);
    try {
      const data = await postRecommend(body);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recommendation failed");
    } finally {
      setBusy(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setPrefs(null);
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppShell restaurantCount={options?.restaurant_count}>
      <section className="relative mb-8 overflow-hidden pb-2">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[340px] w-[850px] -translate-x-1/2 bg-gradient-to-b from-bw-high/40 via-[#1e2023]/10 to-transparent blur-3xl" />

        <div className="relative mb-8 max-w-3xl">
          <h1 className="font-display text-[30px] font-bold leading-[38px] tracking-tight text-bw-text md:text-[40px] md:leading-[48px]">
            Curated Bangalore Dining,
            <br className="hidden sm:inline" />{" "}
            <span className="text-bw-accent-bright">Decoded by AI.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-bw-variant">
            Tailored to your neighborhood, taste cravings, budget tier, and real
            diner sentiment across Bangalore venues.
          </p>
        </div>
      </section>

      {boot === "boot" ? <LoadingState /> : null}

      {boot === "boot_error" ? (
        <ErrorBanner
          title="Unable to load restaurant options"
          message="Could not reach the BiteWise API to load localities and cuisines."
          detail={`${bootError} · API: ${getApiBaseUrl()}`}
          onRetry={() => void loadOptions()}
        />
      ) : null}

      {boot === "ready" && options ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5" ref={formRef}>
            <PreferenceForm options={options} busy={busy} onSubmit={runRecommend} />
          </div>

          <div className="space-y-4 lg:col-span-7">
            {busy ? <LoadingState /> : null}

            {!busy && error ? (
              <ErrorBanner
                title="Unable to complete AI recommendation ranking"
                message="Something went wrong while generating recommendations. Your preferences are preserved — retry or use dry-run mode."
                detail={error}
                onRetry={() => prefs && void runRecommend(prefs)}
                onDryRunRetry={() =>
                  prefs && void runRecommend({ ...prefs, dry_run: true })
                }
              />
            ) : null}

            {!busy && !error && result && prefs ? (
              result.meta.empty || result.items.length === 0 ? (
                <>
                  <FilterSummary
                    prefs={prefs}
                    result={result}
                    budgetLabels={options.budget_labels}
                    onEdit={scrollToForm}
                    onReset={clearResults}
                  />
                  <EmptyState
                    reason={
                      result.meta.empty_reason ||
                      "No restaurants matched your filters."
                    }
                    suggestions={result.meta.suggestions}
                    onReset={() => {
                      clearResults();
                      scrollToForm();
                    }}
                  />
                </>
              ) : (
                <>
                  <FilterSummary
                    prefs={prefs}
                    result={result}
                    budgetLabels={options.budget_labels}
                    onEdit={scrollToForm}
                    onReset={clearResults}
                  />
                  {result.summary ? (
                    <div className="rounded-xl border border-bw-border bg-bw-surface p-4">
                      <div className="flex items-center gap-1.5 font-display text-xs font-semibold text-bw-accent-soft">
                        <span className="material-symbols-outlined text-[16px]">
                          auto_awesome
                        </span>
                        AI summary
                      </div>
                      <p className="mt-1 text-sm text-bw-text">{result.summary}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="font-display text-xl font-bold text-bw-text md:text-[22px]">
                        Curated recommendations
                      </h2>
                      <span className="text-xs font-semibold text-bw-muted">
                        Ranked by preference fit
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {result.items.map((item) => (
                      <RestaurantCard
                        key={`${item.rank}-${item.name}`}
                        item={item}
                        budgetLabels={options.budget_labels}
                      />
                    ))}
                  </div>
                </>
              )
            ) : null}

            {!busy && !error && !result ? (
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-bw-border bg-bw-surface/50 p-6 text-sm text-bw-muted">
                <span className="material-symbols-outlined text-[18px] text-bw-amber">
                  bolt
                </span>
                Powered by filters over Bangalore Zomato venues, then AI ranking
                with explanations.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
