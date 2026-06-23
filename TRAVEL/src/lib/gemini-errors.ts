let geminiPausedUntil = 0;

export function isGeminiPaused(): boolean {
  if (process.env.GEMINI_DISABLE === "true") return true;
  return Date.now() < geminiPausedUntil;
}

export function pauseGemini(minutes = 30): void {
  geminiPausedUntil = Date.now() + minutes * 60 * 1000;
}

export function isGeminiQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; message?: string; code?: number };
  if (e.status === 429 || e.code === 429) return true;
  return typeof e.message === "string" && (
    e.message.includes("429") ||
    e.message.includes("quota") ||
    e.message.includes("RESOURCE_EXHAUSTED")
  );
}
