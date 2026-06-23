import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getLlmRuntimeStatus } from "@/lib/llm";
import { isGeminiConfigured } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/** Statut moteur IA pour l'espace client (sélection auto, sans clés exposées). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const status = getLlmRuntimeStatus();

  return NextResponse.json({
    ...status,
    geminiConfigured: isGeminiConfigured(),
    matchingUrl: "/recherche",
    guideUsesSameEngine: false,
    guidePrimary: isGeminiConfigured() ? "gemini" : status.configured ? "llm" : "offline",
  });
}
