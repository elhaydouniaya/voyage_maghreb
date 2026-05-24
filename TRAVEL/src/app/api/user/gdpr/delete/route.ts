import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { GdprService } from "@/services/gdpr.service";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Connexion client requise." },
      { status: 401 }
    );
  }

  let body: { confirm?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  if (body.confirm !== "SUPPRIMER") {
    return NextResponse.json(
      { error: 'Envoyez { "confirm": "SUPPRIMER" } pour confirmer.' },
      { status: 400 }
    );
  }

  try {
    await GdprService.deleteClientAccount(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la suppression.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
