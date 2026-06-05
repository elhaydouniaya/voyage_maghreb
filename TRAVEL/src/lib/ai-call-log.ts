import { AuditLogService } from "@/services/audit-log.service";

export type AiCallLogEntry = {
  operation: string;
  success: boolean;
  durationMs: number;
  provider?: string;
  error?: string;
};

/** Journalisation des appels IA (CDC C.4 — amélioration des prompts). */
export async function logAiCall(entry: AiCallLogEntry): Promise<void> {
  const payload = JSON.stringify({
    op: entry.operation,
    ok: entry.success,
    ms: entry.durationMs,
    provider: entry.provider,
    err: entry.error?.slice(0, 200),
    at: new Date().toISOString(),
  });
  console.info("[AI]", payload);
  try {
    await AuditLogService.record(`AI_${entry.operation}`, {
      payload,
    });
  } catch {
    /* non bloquant */
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("AI_TIMEOUT"));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
