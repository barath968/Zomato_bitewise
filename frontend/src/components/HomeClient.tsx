"use client";

import { useCallback, useEffect, useState } from "react";

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

  return (
    <AppShell restaurantCount={options?.restaurant_count}>
      <section className="relative mb-8 overflow-hidden pb-2">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[720px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(40,42,45,0.55),transparent_70%)]" />
        <h1 className="relative font-display text-3xl font-bold tracking-tight text-bw-text md:text-4xl">
          Curated Bangalore Dining,
          <br />
          <span className="text-[#ff535a]">Decoded by AI.</span>
        </h1>
        <p className="relative mt-3 max-w-2xl text-base leading-relaxed text-bw-muted">
          Filter real Zomato venues by neighborhood, budget, cuisine, and rating —
          then let the model rank matches and explain why they fit.
        </p>
      </section>

      {boot === "boot" ? <LoadingState /> : null}

      {boot === "boot_error" ? (
        <ErrorBanner
          title="API unavailable"
          message="Could not load restaurant options from the backend."
          detail={`${bootError} · API: ${getApiBaseUrl()}`}
          onRetry={() => void loadOptions()}
        />
      ) : null}

      {boot === "ready" && options ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <PreferenceForm options={options} busy={busy} onSubmit={runRecommend} />
          </div>
          <div className="lg:col-span-7 space-y-4">
            {busy ? <LoadingState /> : null}

            {!busy && error ? (
              <ErrorBanner
                title="Recommendation engine interrupted"
                message="Something went wrong while generating recommendations."
                detail={error}
                onRetry={() => prefs && void runRecommend(prefs)}
              />
            ) : null}

            {!busy && !error && result && prefs ? (
              result.meta.empty || result.items.length === 0 ? (
                <>
                  <FilterSummary
                    prefs={prefs}
                    result={result}
                    budgetLabels={options.budget_labels}
                  />
                  <EmptyState
                    reason={
                      result.meta.empty_reason ||
                      "No restaurants matched your filters."
                    }
                    suggestions={result.meta.suggestions}
                  />
                </>
              ) : (
                <>
                  <FilterSummary
                    prefs={prefs}
                    result={result}
                    budgetLabels={options.budget_labels}
                  />
                  {result.summary ? (
                    <div className="rounded-2xl border border-bw-border bg-bw-surface p-4">
                      <div className="font-display text-sm font-semibold text-bw-text">
                        AI summary
                      </div>
                      <p className="mt-1 text-sm text-bw-text">{result.summary}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl font-bold text-bw-text">
                      Curated recommendations
                    </h2>
                    <span className="text-sm text-bw-muted">Ranked by preference fit</span>
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
              <p className="text-sm text-bw-muted">
                Submit preferences to see ranked recommendations with AI explanations.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
