import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PartnerNewsletterService } from "@/services/partner-newsletter.service";

export const dynamic = "force-dynamic";

/** Envoi manuel admin → agences opt-in (notifyPartnerNewsletter). */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  try {
    const digest = await PartnerNewsletterService.buildDigest();
    const result = await PartnerNewsletterService.sendToOptedInAgencies();
    return NextResponse.json({ ok: true, digest, ...result });
  } catch (error) {
    console.error("POST /api/admin/newsletter/partners", error);
    return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  try {
    const digest = await PartnerNewsletterService.buildDigest();
    return NextResponse.json({ digest });
  } catch (error) {
    console.error("GET /api/admin/newsletter/partners", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
