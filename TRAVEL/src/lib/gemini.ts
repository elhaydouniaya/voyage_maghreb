import { GoogleGenerativeAI } from "@google/generative-ai";

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key.length > 10);
}

export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!isGeminiConfigured()) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}
