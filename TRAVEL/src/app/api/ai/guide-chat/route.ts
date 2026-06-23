import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { resolveSessionUserId } from "@/lib/session-user";
import { AIService } from "@/services/ai.service";
import { GuideProfileService } from "@/services/guide-profile.service";
import { getLlmRuntimeStatus } from "@/lib/llm";
import { guideChatPostSchema, formatZodError } from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    return NextResponse.json(
      { error: session?.user?.id ? "Session expirée. Reconnectez-vous." : "Connexion requise." },
      { status: 401 }
    );
  }

  if (session!.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Ce guide est réservé aux comptes voyageurs." },
      { status: 403 }
    );
  }

  try {
    const ctx = await GuideProfileService.buildContext(
      userId,
      session!.user.name || undefined
    );
    const dbMessages = await GuideProfileService.getRecentMessages(userId);

    const messages =
      dbMessages.length > 0
        ? dbMessages.map((m) => ({
            role: m.role === "user" ? ("user" as const) : ("bot" as const),
            content: m.content,
          }))
        : [{ role: "bot" as const, content: GuideProfileService.buildWelcome(ctx) }];

    const engine = getLlmRuntimeStatus();

    return NextResponse.json({
      messages,
      profile: ctx.profile,
      suggestions: GuideProfileService.buildSuggestions(ctx),
      mode: engine.configured ? "llm" : "offline",
      engine: {
        label: engine.providerLabel,
        model: engine.model,
        provider: engine.activeProvider,
      },
    });
  } catch (error) {
    console.error("GET guide-chat:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`guide-chat:${ip}`, 40, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de messages. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    return NextResponse.json(
      { error: session?.user?.id ? "Session expirée. Reconnectez-vous." : "Connexion requise." },
      { status: 401 }
    );
  }

  if (session!.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Ce guide est réservé aux comptes voyageurs." },
      { status: 403 }
    );
  }

  try {
    const raw = await request.json();
    const parsed = guideChatPostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const messages = parsed.data.messages;
    const last = messages[messages.length - 1];
    if (last.role !== "user") {
      return NextResponse.json({ error: "Message vide." }, { status: 400 });
    }

    await GuideProfileService.appendMessage(userId, "user", last.content.trim());

    const ctx = await GuideProfileService.buildContext(
      userId,
      session!.user.name || undefined
    );

    const { reply, mode } = await AIService.guideChat(messages.slice(-14), ctx);

    await GuideProfileService.appendMessage(userId, "assistant", reply);
    await GuideProfileService.learnFromConversation(userId, [
      ...messages,
      { role: "assistant", content: reply },
    ]);

    const updatedCtx = await GuideProfileService.buildContext(
      userId,
      session!.user.name || undefined
    );

    const engine = getLlmRuntimeStatus();

    return NextResponse.json({
      reply,
      mode,
      suggestions: GuideProfileService.buildSuggestions(updatedCtx),
      profile: updatedCtx.profile,
      engine: {
        label: engine.providerLabel,
        model: engine.model,
        provider: engine.activeProvider,
      },
    });
  } catch (error) {
    console.error("guide-chat API:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
