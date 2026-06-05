import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminService } from "@/services/admin.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const [payments, stripeConnect] = await Promise.all([
      AdminService.listPayments(),
      AdminService.getStripeConnectOverview(),
    ]);
    return NextResponse.json({ payments, stripeConnect });
  } catch (error) {
    console.error("GET /api/admin/payments", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
