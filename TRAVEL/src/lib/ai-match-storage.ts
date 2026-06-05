/** Persiste les résultats du configurateur /recherche pour /voyages?matched=true */
export function saveAiMatchResults(
  results: unknown[],
  summary: string,
  meta?: { matchMode?: string; travelRequestId?: string }
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("ai_match_results", JSON.stringify(results));
    sessionStorage.setItem("ai_match_summary", summary);
    sessionStorage.setItem("ai_match_saved_at", new Date().toISOString());
    if (meta?.matchMode) {
      sessionStorage.setItem("ai_match_mode", meta.matchMode);
    }
    if (meta?.travelRequestId) {
      sessionStorage.setItem("ai_travel_request_id", meta.travelRequestId);
    }
  } catch {
    /* ignore */
  }
}

export function loadTravelRequestId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("ai_travel_request_id");
}

export function loadAiMatchResults(): {
  results: unknown[];
  summary: string;
  matchMode: "qualified" | "fallback" | null;
} {
  if (typeof window === "undefined") {
    return { results: [], summary: "", matchMode: null };
  }
  try {
    const mode = sessionStorage.getItem("ai_match_mode");
    return {
      results: JSON.parse(sessionStorage.getItem("ai_match_results") || "[]"),
      summary: sessionStorage.getItem("ai_match_summary") || "",
      matchMode:
        mode === "fallback" ? "fallback" : mode === "qualified" ? "qualified" : null,
    };
  } catch {
    return { results: [], summary: "", matchMode: null };
  }
}
