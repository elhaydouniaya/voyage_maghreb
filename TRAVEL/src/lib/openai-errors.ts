/** Skip OpenAI calls after quota/rate-limit to avoid slow failed requests. */
let openAiPausedUntil = 0;

export function isOpenAIPaused(): boolean {
  if (process.env.OPENAI_DISABLE === "true") return true;
  return Date.now() < openAiPausedUntil;
}

export function pauseOpenAI(minutes = 30): void {
  openAiPausedUntil = Date.now() + minutes * 60 * 1000;
}

export function isOpenAIQuotaOrRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    status?: number;
    code?: string;
    error?: { code?: string; type?: string };
  };
  if (e.status === 429) return true;
  const code = e.code || e.error?.code;
  return (
    code === "insufficient_quota" ||
    code === "rate_limit_exceeded" ||
    e.error?.type === "insufficient_quota"
  );
}
