import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgenciesService } from "@/services/agencies.service";
import type { AgencyStatus } from "@prisma/client";

const ALLOWED: AgencyStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const status = body.status as AgencyStatus;

    if (!status || !ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const agency = await AgenciesService.updateVerificationStatus(
      id,
      status,
      session.user.id,
      body.note
    );

    return NextResponse.json({
      agency: {
        id: agency.id,
        status: agency.verificationStatus,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mise à jour impossible.";
    const status = message.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
