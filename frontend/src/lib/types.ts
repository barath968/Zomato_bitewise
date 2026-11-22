export type BudgetLevel = "low" | "medium" | "high";

export type RecommendRequest = {
  location: string;
  budget: BudgetLevel;
  cuisine: string;
  min_rating: number;
  additional_preferences: string;
  top_k: number;
  dry_run?: boolean | null;
};

export type RecommendationItem = {
  name: string;
  cuisine: string;
  rating: number;
  estimated_cost: string;
  rank: number;
  explanation: string;
};

export type RecommendationMeta = {
  candidate_count: number;
  returned_count: number;
  match_count_before_cap: number;
  capped: boolean;
  filters_applied: Record<string, unknown>;
  empty: boolean;
  empty_reason: string | null;
  suggestions: string[];
  source: "llm" | "fallback" | "mock" | "empty";
  parse_success: boolean;
  retried: boolean;
  grounded: boolean;
  model: string | null;
  latency_ms: number | null;
  message: string | null;
};

export type RecommendationResponse = {
  summary: string | null;
  items: RecommendationItem[];
  meta: RecommendationMeta;
};

export type OptionsResponse = {
  locations: string[];
  cuisines: string[];
  restaurant_count: number;
  city_option: string;
  any_cuisine: string;
  budget_labels: Record<string, string>;
  top_k_min: number;
  top_k_max: number;
};

export type HealthResponse = {
  status: string;
  restaurant_count: number | null;
  model: string | null;
  dry_run: boolean;
  has_llm_key: boolean;
  detail: string | null;
};
