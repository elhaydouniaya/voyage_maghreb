import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgenciesService } from "@/services/agencies.service";
import { StripeConnectService } from "@/services/stripe-connect.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const agency = await AgenciesService.getByUserId(session.user.id);
    if (!agency) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }

    const status = await StripeConnectService.getStatus(agency.id);
    return NextResponse.json({ status });
  } catch (error) {
    console.error("GET stripe-connect:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!StripeConnectService.isAvailable()) {
    return NextResponse.json(
      {
        error:
          "Stripe n'est pas configuré. Ajoutez STRIPE_SECRET_KEY dans l'environnement serveur.",
      },
      { status: 503 }
    );
  }

  try {
    const agency = await AgenciesService.getByUserId(session.user.id);
    if (!agency) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

    const { url } = await StripeConnectService.createOnboardingLink(
      agency.id,
      appUrl.replace(/\/$/, "")
    );

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onboarding impossible.";
    console.error("POST stripe-connect:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
