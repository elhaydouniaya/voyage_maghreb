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

    // Save user message first
    await GuideProfileService.appendMessage(userId, "user", last.content.trim());

    // Snapshot profile before learning to compute diffs later
    const profileBeforeCtx = await GuideProfileService.buildContext(
      userId,
      session.user.name || undefined
    );

    // Update profile from the new user message (learn from conversation)
    try {
      await GuideProfileService.learnFromConversation(userId, messages);
    } catch (e) {
      console.warn("learnFromConversation warning:", e);
    }

    // Rebuild context after learning
    const ctx = await GuideProfileService.buildContext(
      userId,
      session.user.name || undefined
    );

    // Quick path: if the user message is a simple greeting and profile is empty, use the offline guide to respond immediately
    const lastText = last.content.trim();
    if (/^(salam|bonjour|bonsoir|hello|coucou|hey)[\s!.,]*$/i.test(lastText) && (!ctx.profile.preferredDestinations || ctx.profile.preferredDestinations.length === 0)) {
      try {
        const recent = await GuideProfileService.getRecentMessages(userId);
        const msgsForOffline = recent.length > 0 ? recent.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })) : [{ role: 'assistant', content: GuideProfileService.buildWelcome(ctx) }];
        const offlineReply = AIService.guideChatOffline(msgsForOffline as any, ctx as any);
        await GuideProfileService.appendMessage(userId, 'assistant', offlineReply);
        const updatedCtx = await GuideProfileService.buildContext(userId, session.user.name || undefined);
        const structured = AIService.structureDemandHeuristic({
          destination: updatedCtx.profile.preferredDestinations?.[0] || "",
          isDateFlexible: true,
          budgetMax: updatedCtx.profile.budgetMax ?? 0,
          tripType: updatedCtx.profile.travelStyles || [],
          numberOfTravelers: updatedCtx.profile.travelersCount ?? 1,
        } as any);

        return NextResponse.json({
          reply: offlineReply,
          mode: 'offline',
          suggestions: GuideProfileService.buildSuggestions(updatedCtx),
          profile: updatedCtx.profile,
          structuredDemand: structured,
          missingInformation: [],
          confidence: { percent: 100, label: 'high' },
          diffs: {},
        });
      } catch (e) {
        console.warn('offline quick path failed:', e);
      }
    }

    // Build a lightweight TravelRequestData object from current profile to pass as structured_demand
    const travelDataFromProfile: import("@/services/ai.service").TravelRequestData = {
      destination: ctx.profile.preferredDestinations?.[0] || "",
      isDateFlexible: true,
      startDate: undefined,
      endDate: undefined,
      duration: undefined,
      budgetMax: ctx.profile.budgetMax ?? 0,
      tripType: ctx.profile.travelStyles || [],
      tripStyle: ctx.profile.travelStyles || [],
      numberOfTravelers: ctx.profile.travelersCount ?? 1,
      accommodation: undefined,
      transportIncluded: false,
      activities: [],
      constraints: undefined,
    };

    // Call single LLM analysis + draftReply using conversation summary, profile, and structured demand
    const conversationSummary = profileBeforeCtx.profile.lastSummary || "";

    const analyzeResult = await AIService.analyzeWithDraft({
      conversation_summary: conversationSummary,
      current_profile: profileBeforeCtx.profile,
      structured_demand: AIService.structureDemandHeuristic(travelDataFromProfile as any),
      latest_user_message: last.content.trim(),
      promptVersion: "v1.0",
    });

    // Merge LLM-extracted entities deterministically into the canonical profile
    try {
      await GuideProfileService.mergeEntitiesIntoProfile(userId, analyzeResult.analysis || {});
    } catch (e) {
      console.warn('mergeEntitiesIntoProfile failed:', e);
    }

    // Rebuild context after merging entities
    const ctxAfterAnalysis = await GuideProfileService.buildContext(
      userId,
      session.user.name || undefined
    );

    // Compute structured demand from updated profile
    let structured: import("@/services/ai.service").StructuredDemand;
    try {
      const travelDataForStruct: import("@/services/ai.service").TravelRequestData = {
        destination: ctxAfterAnalysis.profile.preferredDestinations?.[0] || "",
        isDateFlexible: true,
        startDate: undefined,
        endDate: undefined,
        duration: undefined,
        budgetMax: ctxAfterAnalysis.profile.budgetMax ?? 0,
        tripType: ctxAfterAnalysis.profile.travelStyles || [],
        tripStyle: ctxAfterAnalysis.profile.travelStyles || [],
        numberOfTravelers: ctxAfterAnalysis.profile.travelersCount ?? 1,
        accommodation: undefined,
        transportIncluded: false,
        activities: [],
        constraints: undefined,
      };
      structured = await AIService.structureDemand(travelDataForStruct as any);
    } catch (e) {
      structured = AIService.structureDemandHeuristic(travelDataFromProfile as any);
    }

    // Determine missing information keys
    const requiredKeys = [
      "destination",
      "budgetMax",
      "startDate",
      "numberOfTravelers",
    ];
    const missing: string[] = [];
    if (!structured.destinationNormalized || structured.destinationNormalized.trim() === "") missing.push("destination");
    if (!structured.budgetMax || Number(structured.budgetMax) <= 0) missing.push("budget");
    if (!structured.startDate) missing.push("dates");
    if (!structured.numberOfSeats || Number(structured.numberOfSeats) <= 0) missing.push("travelers");

    // Confidence indicator (simple heuristic)
    const totalRequired = requiredKeys.length;
    const missingCount = missing.length;
    const confidencePercent = Math.round(((totalRequired - missingCount) / totalRequired) * 100);
    const confidenceLabel =
      confidencePercent >= 90 ? "high" : confidencePercent >= 60 ? "medium" : "low";

    // Decide assistant reply: use LLM draftReply when appropriate. The backend is authoritative and may override.
    const replyFromLLM = analyzeResult?.draftReply || "";
    const assistantState = { structuredDemand: structured, missingInformation: missing, confidence: { percent: confidencePercent, label: confidenceLabel }, analysis: analyzeResult?.analysis };

    // For now, use the LLM draftReply directly as assistant reply. Backend may modify this in future.
    const reply = replyFromLLM;
    const mode = "draft";

    // Persist assistant reply
    await GuideProfileService.appendMessage(userId, "assistant", reply);

    // Build updated context after assistant reply
    const updatedCtx = await GuideProfileService.buildContext(
      userId,
      session.user.name || undefined
    );

    // Compute profile diffs (what changed)
    function diffArrays(a: string[] = [], b: string[] = []) {
      const added = b.filter((x) => !a.includes(x));
      const removed = a.filter((x) => !b.includes(x));
      return { added, removed };
    }

    const diffs: Record<string, any> = {};
    if ((profileBeforeCtx.profile.preferredDestinations || []).join() !== (updatedCtx.profile.preferredDestinations || []).join()) {
      diffs.destinations = diffArrays(profileBeforeCtx.profile.preferredDestinations, updatedCtx.profile.preferredDestinations);
    }
    if ((profileBeforeCtx.profile.travelStyles || []).join() !== (updatedCtx.profile.travelStyles || []).join()) {
      diffs.travelStyles = diffArrays(profileBeforeCtx.profile.travelStyles, updatedCtx.profile.travelStyles);
    }
    if ((profileBeforeCtx.profile.budgetMax ?? null) !== (updatedCtx.profile.budgetMax ?? null)) {
      diffs.budgetMax = { before: profileBeforeCtx.profile.budgetMax ?? null, after: updatedCtx.profile.budgetMax ?? null };
    }
    if ((profileBeforeCtx.profile.travelersCount ?? null) !== (updatedCtx.profile.travelersCount ?? null)) {
      diffs.travelersCount = { before: profileBeforeCtx.profile.travelersCount ?? null, after: updatedCtx.profile.travelersCount ?? null };
    }

    return NextResponse.json({
      reply,
      mode,
      suggestions: GuideProfileService.buildSuggestions(updatedCtx),
      profile: updatedCtx.profile,
      structuredDemand: structured,
      missingInformation: missing,
      confidence: { percent: confidencePercent, label: confidenceLabel },
      diffs,
    });
  } catch (error) {
    console.error("guide-chat API:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
