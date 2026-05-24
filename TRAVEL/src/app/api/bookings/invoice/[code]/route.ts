import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BookingsService } from "@/services/bookings.service";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const invoice = await BookingsService.getInvoice(
      params.code,
      session.user.id,
      session.user.role || "CLIENT"
    );
    return NextResponse.json({ invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur.";
    const status = message.includes("Accès") ? 403 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
