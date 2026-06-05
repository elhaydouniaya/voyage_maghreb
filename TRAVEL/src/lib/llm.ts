import OpenAI from "openai";
import {
  isOpenAIPaused,
  isOpenAIQuotaOrRateLimitError,
  pauseOpenAI,
} from "@/lib/openai-errors";

export type LlmChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmChatOptions = {
  messages: LlmChatMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
};

export type LlmEngineId = "groq" | "openai" | "compatible";

export type LlmEngine = {
  id: LlmEngineId;
  label: string;
  model: string;
  client: OpenAI;
};

export type LlmRuntimeStatus = {
  strategy: "auto";
  activeProvider: LlmEngineId | "offline";
  providerLabel: string;
  model: string | null;
  configured: boolean;
  engines: {
    groq: boolean;
    openai: boolean;
    compatible: boolean;
  };
  priority: string[];
  recommendation: string;
};

let lastSuccessfulEngineId: LlmEngineId | null = null;

function isValidKey(key: string | undefined): key is string {
  if (!key?.trim()) return false;
  const k = key.trim();
  return k.length >= 10 && !k.startsWith("sk-...");
}

export function isLlmDisabled(): boolean {
  return process.env.OPENAI_DISABLE === "true" || isOpenAIPaused();
}

function buildGroqEngine(): LlmEngine | null {
  const baseUrl =
    process.env.LLM_BASE_URL?.trim() || "https://api.groq.com/openai/v1";
  const viaGroqUrl = baseUrl.includes("groq");

  const apiKey =
    process.env.GROQ_API_KEY?.trim() ||
    (viaGroqUrl ? process.env.LLM_API_KEY?.trim() : "");

  if (!isValidKey(apiKey)) return null;

  const model =
    process.env.GROQ_MODEL?.trim() ||
    process.env.LLM_MODEL?.trim() ||
    "llama-3.3-70b-versatile";

  return {
    id: "groq",
    label: "Groq · Llama",
    model,
    client: new OpenAI({
      apiKey: apiKey!,
      baseURL: viaGroqUrl ? baseUrl : "https://api.groq.com/openai/v1",
    }),
  };
}

function buildOpenAIEngine(): LlmEngine | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!isValidKey(apiKey)) return null;

  const model =
    process.env.OPENAI_MODEL?.trim() ||
    process.env.LLM_MODEL?.trim() ||
    "gpt-4o-mini";

  return {
    id: "openai",
    label: "OpenAI",
    model,
    client: new OpenAI({ apiKey: apiKey! }),
  };
}

/** Ollama, Together, ou autre endpoint compatible OpenAI (hors Groq déjà géré). */
function buildCompatibleEngine(): LlmEngine | null {
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  if (!baseUrl || baseUrl.includes("groq")) return null;

  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!isValidKey(apiKey)) return null;

  const model = process.env.LLM_MODEL?.trim() || "llama3";
  let label = "LLM compatible";
  if (baseUrl.includes("ollama") || baseUrl.includes("11434")) {
    label = "Ollama (local)";
  } else if (baseUrl.includes("together")) {
    label = "Together · Llama";
  }

  return {
    id: "compatible",
    label,
    model,
    client: new OpenAI({ apiKey: apiKey!, baseURL: baseUrl }),
  };
}

/** Ordre recommandé production : Groq (rapide/économique) → OpenAI → compatible. */
export function getLlmEnginesOrdered(): LlmEngine[] {
  const engines: LlmEngine[] = [];
  const groq = buildGroqEngine();
  const openai = buildOpenAIEngine();
  const compatible = buildCompatibleEngine();

  if (groq) engines.push(groq);
  if (openai) engines.push(openai);
  if (compatible) engines.push(compatible);

  return engines;
}

export function getLlmRuntimeStatus(): LlmRuntimeStatus {
  const disabled = isLlmDisabled();
  const ordered = getLlmEnginesOrdered();
  const configured = !disabled && ordered.length > 0;

  const primary =
    (lastSuccessfulEngineId &&
      ordered.find((e) => e.id === lastSuccessfulEngineId)) ||
    ordered[0];

  const activeProvider = configured
    ? (primary?.id ?? "offline")
    : "offline";

  let recommendation =
    "Configurez GROQ_API_KEY (recommandé) ou OPENAI_API_KEY dans .env pour activer l'IA.";
  if (configured) {
    if (ordered.some((e) => e.id === "groq")) {
      recommendation =
        "Sélection automatique : Llama via Groq en priorité, secours OpenAI si configuré, puis conseiller local.";
    } else if (ordered.some((e) => e.id === "openai")) {
      recommendation =
        "OpenAI actif. Ajoutez Groq pour des réponses plus rapides et un coût réduit (voir .env.example).";
    } else {
      recommendation = "Moteur compatible actif avec repli sur le conseiller local en cas d'erreur.";
    }
  }

  return {
    strategy: "auto",
    activeProvider,
    providerLabel: primary?.label ?? "Conseiller local",
    model: primary?.model ?? null,
    configured,
    engines: {
      groq: Boolean(buildGroqEngine()),
      openai: Boolean(buildOpenAIEngine()),
      compatible: Boolean(buildCompatibleEngine()),
    },
    priority: configured
      ? [
          ...ordered.map((e) => e.label),
          "Conseiller local (secours)",
        ]
      : ["Conseiller local"],
    recommendation,
  };
}

export function isLlmConfigured(): boolean {
  return getLlmEnginesOrdered().length > 0;
}

export function getLlmModel(): string {
  const engines = getLlmEnginesOrdered();
  return engines[0]?.model ?? "gpt-4o-mini";
}

export function getLlmProviderLabel(): string {
  return getLlmRuntimeStatus().providerLabel;
}

export function getLlmClient(): OpenAI | null {
  return getLlmEnginesOrdered()[0]?.client ?? null;
}

/** Chat avec repli automatique sur le prochain moteur disponible. */
export async function llmChatCompletion(
  options: LlmChatOptions
): Promise<string | null> {
  if (isLlmDisabled() || !isLlmConfigured()) return null;

  const engines = getLlmEnginesOrdered();
  if (engines.length === 0) return null;

  for (const engine of engines) {
    try {
      const completion = await engine.client.chat.completions.create({
        model: engine.model,
        messages: options.messages,
        max_tokens: options.maxTokens ?? 650,
        temperature: options.temperature ?? 0.75,
        ...(options.jsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
      });

      const text = completion.choices[0]?.message?.content?.trim() || null;
      if (text) {
        lastSuccessfulEngineId = engine.id;
        return text;
      }
    } catch (error) {
      if (engine.id === "openai" && isOpenAIQuotaOrRateLimitError(error)) {
        pauseOpenAI(60);
        console.warn("OpenAI quota/rate limit — pause 60 min, essai moteur suivant");
      } else {
        console.warn(`${engine.label} indisponible, moteur suivant…`, error);
      }
    }
  }

  return null;
}

export { isOpenAIPaused, pauseOpenAI, isOpenAIQuotaOrRateLimitError };
