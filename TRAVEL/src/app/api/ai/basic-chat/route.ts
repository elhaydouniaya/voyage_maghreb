import { NextResponse } from "next/server";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { isOpenAIPaused, isOpenAIQuotaOrRateLimitError, pauseOpenAI } from "@/lib/openai-errors";

export const dynamic = "force-dynamic";

const BASIC_SYSTEM_PROMPT = `Tu es un assistant découverte MaghrebVoyage. Tu aides les visiteurs à explorer les destinations du Maghreb (Maroc, Algérie, Tunisie, Mauritanie, Libye).
Réponds en français, avec chaleur et enthousiasme. Partage des infos générales sur les destinations, la culture, la météo et les conseils de voyage basiques.
Pour des recommandations personnalisées, de la planification sur-mesure ou pour réserver un voyage, invite gentiment l'utilisateur à créer un compte voyageur gratuit sur MaghrebVoyage.
Ne fournis pas de prix ou de disponibilités exactes. Garde tes réponses concises (3-5 phrases max).`;

function basicOffline(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("maroc") || msg.includes("marrakech") || msg.includes("fès") || msg.includes("casablanca")) {
    return "Le Maroc est une destination fascinante aux mille visages : médinas historiques, dunes du Sahara, montagnes de l'Atlas et côtes atlantiques. Pour planifier votre itinéraire personnalisé, créez un compte voyageur gratuit sur MaghrebVoyage !";
  }
  if (msg.includes("algérie") || msg.includes("algerie") || msg.includes("tassili") || msg.includes("djanet")) {
    return "L'Algérie offre des paysages époustouflants : le Tassili n'Ajjer, les oasis du Sahara et une culture berbère très riche. Pour découvrir nos circuits sur-mesure, inscrivez-vous gratuitement !";
  }
  if (msg.includes("tunisie") || msg.includes("djerba") || msg.includes("carthage")) {
    return "La Tunisie séduit par ses plages de Djerba, ses sites antiques comme Carthage et sa gastronomie délicieuse. Pour des recommandations personnalisées, créez un compte voyageur !";
  }
  return "Je suis votre guide pour découvrir le Maghreb ! Pour des conseils personnalisés adaptés à vos envies et un accès complet à nos services, créez un compte voyageur gratuit. Dites-moi quelle destination vous attire !";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages as { role: "user" | "assistant"; content: string }[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages invalides." }, { status: 400 });
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user" || !last.content?.trim()) {
      return NextResponse.json({ error: "Message vide." }, { status: 400 });
    }

    if (!isOpenAIConfigured() || isOpenAIPaused()) {
      return NextResponse.json({ reply: basicOffline(last.content), mode: "offline" });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ reply: basicOffline(last.content), mode: "offline" });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: BASIC_SYSTEM_PROMPT },
          ...messages.slice(-6).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || basicOffline(last.content);
      return NextResponse.json({ reply, mode: "openai" });
    } catch (error) {
      if (isOpenAIQuotaOrRateLimitError(error)) {
        pauseOpenAI(60);
      } else {
        console.error("basic-chat openai error:", error);
      }
      return NextResponse.json({ reply: basicOffline(last.content), mode: "offline" });
    }
  } catch (error) {
    console.error("basic-chat API:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
