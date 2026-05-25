import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BookingsService } from "@/services/bookings.service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));

    const token =
      body.token ||
      new URL(request.url).searchParams.get("token");

    if (session?.user?.id && body.bookingId) {
      await BookingsService.cancelByIdForUser(
        String(body.bookingId),
        session.user.id,
        body.reason
      );
      return NextResponse.json({ success: true });
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token ou réservation manquant." },
        { status: 400 }
      );
    }

    await BookingsService.cancelByToken(String(token));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Annulation impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
