import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isEmailConfigured } from "@/lib/email-config";
import { BookingsService } from "@/services/bookings.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  const sessionId = searchParams.get("session_id");

  try {
    if (sessionId) {
      const booking = await BookingsService.getPublicByStripeSession(sessionId);
      const email = await BookingsService.ensureConfirmationEmailsSent(booking.id!).catch(
        () => ({ sent: false, alreadySent: true, to: "" })
      );
      return NextResponse.json({
        booking,
        emailSent: email.sent || email.alreadySent,
        emailTo: email.to || undefined,
        emailMode: isEmailConfigured() ? "resend" : "console",
      });
    }

    if (bookingId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const booking = await BookingsService.getByIdForUser(
          bookingId,
          session.user.id
        );
        if (booking) {
          const email = await BookingsService.ensureConfirmationEmailsSent(bookingId).catch(
            () => ({ sent: false, alreadySent: true, to: "" })
          );
          return NextResponse.json({
            booking,
            emailSent: email.sent || email.alreadySent,
            emailTo: email.to || undefined,
            emailMode: isEmailConfigured() ? "resend" : "console",
          });
        }
      }

      const publicBooking = await BookingsService.getByIdPublic(bookingId);
      if (publicBooking) {
        const email = await BookingsService.ensureConfirmationEmailsSent(bookingId).catch(
          () => ({ sent: false, alreadySent: true, to: "" })
        );
        return NextResponse.json({
          booking: publicBooking,
          emailSent: email.sent || email.alreadySent,
          emailTo: email.to || undefined,
          emailMode: isEmailConfigured() ? "resend" : "console",
        });
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
