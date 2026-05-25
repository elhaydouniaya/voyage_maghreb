import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) {
    return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { agencyId: agency.id },
    orderBy: { createdAt: "desc" },
    include: {
      groupTrip: { select: { title: true, destination: true, startDate: true } },
    },
  });

  const header =
    "Code;Client;Email;Telephone;Voyage;Destination;Depart;Places;Acompte;Statut;Date\n";
  const rows = bookings.map((b) => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      b.confirmationCode,
      escape(b.clientName),
      b.clientEmail,
      b.clientPhone || "",
      escape(b.groupTrip.title),
      escape(b.groupTrip.destination),
      b.groupTrip.startDate.toISOString().split("T")[0],
      b.numberOfSeats,
      Math.round(Number(b.depositPaid)),
      b.status,
      b.createdAt.toISOString().split("T")[0],
    ].join(";");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${agency.name.slice(0, 20).replace(/\s+/g, "-")}.csv"`,
    },
  });
}
