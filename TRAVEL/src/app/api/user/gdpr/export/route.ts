import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { GdprService } from "@/services/gdpr.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const data = await GdprService.exportUserData(session.user.id);
    const filename = `maghrebvoyage-export-${session.user.id.slice(0, 8)}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/user/gdpr/export", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
