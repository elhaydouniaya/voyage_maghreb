import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AIService } from "@/services/ai.service";
import { GuideProfileService } from "@/services/guide-profile.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Ce guide est réservé aux comptes voyageurs." },
      { status: 403 }
    );
  }

  try {
    const ctx = await GuideProfileService.buildContext(
      session.user.id,
      session.user.name || undefined
    );
    const dbMessages = await GuideProfileService.getRecentMessages(session.user.id);

    const messages =
      dbMessages.length > 0
        ? dbMessages.map((m) => ({
            role: m.role === "user" ? ("user" as const) : ("bot" as const),
            content: m.content,
          }))
        : [{ role: "bot" as const, content: GuideProfileService.buildWelcome(ctx) }];

    return NextResponse.json({
      messages,
      profile: ctx.profile,
      suggestions: GuideProfileService.buildSuggestions(ctx),
      mode: "ready",
    });
  } catch (error) {
    console.error("GET guide-chat:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Ce guide est réservé aux comptes voyageurs." },
      { status: 403 }
    );
  }

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

    const userId = session.user.id;
    await GuideProfileService.appendMessage(userId, "user", last.content.trim());

    const ctx = await GuideProfileService.buildContext(
      userId,
      session.user.name || undefined
    );

    const { reply, mode } = await AIService.guideChat(messages.slice(-14), ctx);

    await GuideProfileService.appendMessage(userId, "assistant", reply);
    await GuideProfileService.learnFromConversation(userId, [
      ...messages,
      { role: "assistant", content: reply },
    ]);

    const updatedCtx = await GuideProfileService.buildContext(
      userId,
      session.user.name || undefined
    );

    return NextResponse.json({
      reply,
      mode,
      suggestions: GuideProfileService.buildSuggestions(updatedCtx),
      profile: updatedCtx.profile,
    });
  } catch (error) {
    console.error("guide-chat API:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
