import type {
  HealthResponse,
  OptionsResponse,
  RecommendRequest,
  RecommendationResponse,
} from "./types";

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return apiBase();
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (data.detail != null) return JSON.stringify(data.detail);
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${apiBase()}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<HealthResponse>;
}

export async function fetchOptions(): Promise<OptionsResponse> {
  const res = await fetch(`${apiBase()}/options`, { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<OptionsResponse>;
}

export async function postRecommend(
  body: RecommendRequest,
): Promise<RecommendationResponse> {
  const res = await fetch(`${apiBase()}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<RecommendationResponse>;
}

export function costLabel(
  estimatedCost: string,
  budgetLabels?: Record<string, string>,
): string {
  const key = estimatedCost.trim().toLowerCase();
  if (budgetLabels?.[key]) return budgetLabels[key];
  if (key) return estimatedCost;
  return "Cost unavailable";
}
