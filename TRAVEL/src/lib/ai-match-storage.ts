/** Persiste les résultats du configurateur /recherche pour /voyages?matched=true */
export function saveAiMatchResults(
  results: unknown[],
  summary: string
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("ai_match_results", JSON.stringify(results));
    sessionStorage.setItem("ai_match_summary", summary);
    sessionStorage.setItem("ai_match_saved_at", new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function loadAiMatchResults(): {
  results: unknown[];
  summary: string;
} {
  if (typeof window === "undefined") {
    return { results: [], summary: "" };
  }
  try {
    return {
      results: JSON.parse(sessionStorage.getItem("ai_match_results") || "[]"),
      summary: sessionStorage.getItem("ai_match_summary") || "",
    };
  } catch {
    return { results: [], summary: "" };
  }
}
