import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BookingsService } from "@/services/bookings.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  const sessionId = searchParams.get("session_id");

  try {
    if (sessionId) {
      const booking = await BookingsService.getPublicByStripeSession(sessionId);
      return NextResponse.json({ booking });
    }

    if (bookingId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const booking = await BookingsService.getByIdForUser(
          bookingId,
          session.user.id
        );
        if (booking) {
          return NextResponse.json({ booking });
        }
      }

      const publicBooking = await BookingsService.getByIdPublic(bookingId);
      if (publicBooking) {
        return NextResponse.json({ booking: publicBooking });
      }

      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Paramètre bookingId ou session_id requis." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Chargement impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
