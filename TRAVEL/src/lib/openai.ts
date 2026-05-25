import OpenAI from "openai";

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key.length > 10 && !key.startsWith("sk-..."));
}

export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured()) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
