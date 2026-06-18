import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import {
  sendAgencyClientCancelledEmail,
  sendAgencyNewBookingEmail,
  sendBookingConfirmationEmail,
  sendClientCancellationEmail,
} from "@/lib/booking-emails";
import { TravelRequestsService } from "@/services/travel-requests.service";

function formatFrDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generateConfirmationCode(): string {
  return `MV-${randomInt(100000, 999999)}`;
}

// Raw row shape returned by SELECT FOR UPDATE
type TripRow = {
  id: string;
  totalSpots: number;
  bookedSpots: number;
  reservedSpots: number;
  status: string;
  agencyId: string;
  depositAmount: string; // Decimal comes back as string from raw query
  totalPrice: string;
  currency: string;
};

/** Window within which a PENDING_PAYMENT booking holds its reserved seats. */
const RESERVATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface InitiateBookingInput {
  groupTripId: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCountry?: string;
  numberOfSeats: number;
  notes?: string;
  travelRequestId?: string;
  acceptCgu: boolean;
  acceptRgpd: boolean;
}

export class BookingsService {
  /**
   * FIX #1 — Seat reservation with SELECT FOR UPDATE.
   *
   * All concurrent calls are serialised at the PostgreSQL row level:
   *   1. Lock GroupTrip row
   *   2. Read available = totalSpots - bookedSpots - reservedSpots
   *   3. If enough → reservedSpots += numberOfSeats
   *   4. Create Booking (PENDING_PAYMENT, expiresAt = now + 30 min)
   *
   * No two transactions can allocate the same seats simultaneously.
   */
  static async initiate(input: InitiateBookingInput) {
    if (!input.acceptCgu || !input.acceptRgpd) {
      throw new Error("Vous devez accepter les CGU et la politique RGPD.");
    }
    if (input.clientName.trim().length < 2) {
      throw new Error("Le nom est requis.");
    }

    const booking = await prisma.$transaction(
      async (tx) => {
        const rows = await tx.$queryRaw<TripRow[]>`
          SELECT id, "totalSpots", "bookedSpots", "reservedSpots",
                 status, "agencyId",
                 "depositAmount"::text AS "depositAmount",
                 "totalPrice"::text   AS "totalPrice",
                 currency
          FROM   "GroupTrip"
          WHERE  id = ${input.groupTripId}
          FOR UPDATE
        `;

        if (rows.length === 0) throw new Error("Voyage introuvable.");
        const trip = rows[0];

        if (trip.status !== "PUBLISHED") {
          throw new Error("Ce voyage n'est pas disponible à la réservation.");
        }

        // ── Availability check (accounts for concurrent pending bookings) ──
        const availableSpots =
          trip.totalSpots - trip.bookedSpots - trip.reservedSpots;

        const travelRequestId = await TravelRequestsService.resolveRequestIdForUser(
          input.userId,
          input.travelRequestId
        );

        if (availableSpots < input.numberOfSeats) {
          throw new Error(
            `Places insuffisantes. Il reste ${availableSpots} place(s) disponible(s).`
          );
        }

        await tx.groupTrip.update({
          where: { id: trip.id },
          data: { reservedSpots: { increment: input.numberOfSeats } },
        });

        const depositPerSeat = Number(trip.depositAmount);
        const totalPerSeat = Number(trip.totalPrice);
        const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

        const booking = await tx.booking.create({
          data: {
            groupTripId: trip.id,
            agencyId: trip.agencyId,
            userId: input.userId,
            travelRequestId,
            clientName: input.clientName.trim(),
            clientEmail: input.clientEmail.trim().toLowerCase(),
            clientPhone: input.clientPhone,
            clientCountry: input.clientCountry,
            numberOfSeats: input.numberOfSeats,
            depositPaid: depositPerSeat * input.numberOfSeats,
            totalAmount: totalPerSeat * input.numberOfSeats,
            confirmationCode: generateConfirmationCode(),
            status: "PENDING_PAYMENT",
            expiresAt,
            notes: input.notes,
          },
          include: { groupTrip: true },
        });

        return booking;
      },
      { timeout: 10_000, maxWait: 5_000 }
    );

    if (booking.travelRequestId) {
      void TravelRequestsService.markPaymentPending(booking.travelRequestId);
    }
    return booking;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cancellation helpers
  // ───────────────────────────────────────────────────────────────────────────

  static async cancelByIdForUser(
    bookingId: string,
    userId: string,
    reason?: string
  ) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { groupTrip: true },
    });

    if (!booking) throw new Error("Réservation introuvable.");
    if (booking.status === "CANCELLED") {
      throw new Error("Cette réservation est déjà annulée.");
    }
    if (booking.status !== "CONFIRMED") {
      throw new Error("Cette réservation ne peut pas être annulée.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason?.trim() || "Annulation par le client",
        },
      });

      const trip = await tx.groupTrip.update({
        where: { id: booking.groupTripId },
        data: { bookedSpots: { decrement: booking.numberOfSeats } },
      });

      if (trip.status === "FULL" && trip.bookedSpots < trip.totalSpots) {
        await tx.groupTrip.update({
          where: { id: trip.id },
          data: { status: "PUBLISHED" },
        });
      }

      return { booking: updatedBooking };
    });

    await this.notifyCancellationEmails(booking.id);
    return result;
  }

  static async cancelByToken(token: string) {
    const booking = await prisma.booking.findFirst({
      where: { cancellationToken: token },
      include: { groupTrip: true },
    });

    if (!booking) throw new Error("Réservation introuvable.");
    if (booking.status === "CANCELLED") {
      throw new Error("Cette réservation est déjà annulée.");
    }
    if (booking.status !== "CONFIRMED") {
      throw new Error("Cette réservation ne peut pas être annulée.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      const trip = await tx.groupTrip.update({
        where: { id: booking.groupTripId },
        data: { bookedSpots: { decrement: booking.numberOfSeats } },
      });

      let tripStatus = trip.status;
      if (trip.status === "FULL") {
        await tx.groupTrip.update({
          where: { id: trip.id },
          data: { status: "PUBLISHED" },
        });
        tripStatus = "PUBLISHED";
      }

      return { booking: updatedBooking, tripStatus };
    });

    await this.notifyCancellationEmails(booking.id);
    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FIX #2 — Stripe confirmation (atomic claim + row lock + idempotency)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Called by the Stripe webhook (checkout.session.completed).
   *
   * Race-condition safety:
   *   • The `updateMany(..., status: PENDING_PAYMENT → CONFIRMED)` acts as an
   *     atomic compare-and-swap. PostgreSQL serialises concurrent updates on
   *     the same row: the second concurrent attempt sees `count = 0` and exits.
   *   • The GroupTrip row is then locked (FOR UPDATE) before incrementing
   *     bookedSpots, preventing double-counting.
   *   • The unique constraint on Payment.stripeSessionId is a final safety net
   *     against duplicate webhook deliveries that somehow bypass the booking
   *     status check.
   */
  static async confirmFromStripeSession(
    stripeSessionId: string,
    metadata: Record<string, string>
  ) {
    const bookingId = metadata.bookingId;
    if (!bookingId) throw new Error("bookingId manquant dans metadata Stripe.");

    let enrichedMeta = { ...metadata };
    let paymentIntentId: string | undefined;

    const { stripe } = await import("@/lib/stripe");
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
        enrichedMeta = { ...enrichedMeta, ...(session.metadata || {}) };
        if (typeof session.payment_intent === "string") {
          paymentIntentId = session.payment_intent;
        }
      } catch (e) {
        console.warn("Stripe session retrieve:", e);
      }
    }

    const platformFeeCents = Number(enrichedMeta.platformFeeCents || 0);
    const payoutMode =
      enrichedMeta.payoutMode === "connect" ? "connect" : "platform";

    return prisma
      .$transaction(
        async (tx) => {
          const claimed = await tx.booking.updateMany({
            where: { id: bookingId, status: "PENDING_PAYMENT" },
            data: { status: "CONFIRMED" },
          });

          if (claimed.count === 0) {
            const existing = await tx.booking.findUnique({
              where: { id: bookingId },
              select: { status: true },
            });
            if (existing?.status === "CONFIRMED") {
              return { alreadyProcessed: true as const };
            }
            if (existing?.status === "EXPIRED") {
              throw new Error(
                "La réservation a expiré. Le client doit recommencer la réservation."
              );
            }
            return { alreadyProcessed: true as const };
          }

          const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { groupTrip: true },
          });
          if (!booking) throw new Error("Booking introuvable après update.");

          await tx.$queryRaw`
            SELECT id FROM "GroupTrip"
            WHERE id = ${booking.groupTripId}
            FOR UPDATE
          `;

          const updatedTrip = await tx.groupTrip.update({
            where: { id: booking.groupTripId },
            data: {
              bookedSpots: { increment: booking.numberOfSeats },
              reservedSpots: { decrement: booking.numberOfSeats },
            },
          });

          if (updatedTrip.bookedSpots >= updatedTrip.totalSpots) {
            await tx.groupTrip.update({
              where: { id: booking.groupTripId },
              data: { status: "FULL" },
            });
          }

          const payment = await tx.payment.create({
            data: {
              bookingId: booking.id,
              groupTripId: booking.groupTripId,
              agencyId: booking.agencyId,
              stripeSessionId,
              stripePaymentIntentId: paymentIntentId,
              stripeCustomerEmail:
                enrichedMeta.clientEmail || booking.clientEmail,
              amount: booking.depositPaid,
              currency: booking.groupTrip.currency,
              payoutMode,
              platformFeeCents,
              agencyNetCents: Math.max(
                0,
                Math.round(Number(booking.depositPaid) * 100) - platformFeeCents
              ),
              status: "SUCCEEDED",
              paidAt: new Date(),
            },
          });

          return {
            alreadyProcessed: false as const,
            bookingId: booking.id,
            booking,
            payment,
            confirmationCode: booking.confirmationCode,
          };
        },
        { timeout: 15_000, maxWait: 5_000 }
      )
      .then(async (result) => {
        if (!result.alreadyProcessed && "bookingId" in result) {
          await TravelRequestsService.markPaidForBooking(result.bookingId);
        }
        return result;
      });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FIX #3 — Expire stale PENDING_PAYMENT bookings (called by cron)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Finds all PENDING_PAYMENT bookings whose `expiresAt` has passed and
   * atomically transitions them to EXPIRED, releasing reserved seats back
   * to the pool.
   *
   * Safe to call concurrently (each booking is updated with a status-guard
   * to prevent double-processing).
   */
  static async expireStaleBookings(): Promise<{ expired: number; errors: number }> {
    const stale = await prisma.booking.findMany({
      where: {
        status: "PENDING_PAYMENT",
        expiresAt: { not: null, lt: new Date() },
      },
      select: { id: true, groupTripId: true, numberOfSeats: true },
    });

    let expired = 0;
    let errors = 0;

    for (const b of stale) {
      try {
        await prisma.$transaction(async (tx) => {
          // Guard: only proceed if still PENDING_PAYMENT
          const result = await tx.booking.updateMany({
            where: { id: b.id, status: "PENDING_PAYMENT" },
            data:  { status: "EXPIRED" },
          });

          if (result.count > 0) {
            // Release the reserved seats
            await tx.groupTrip.update({
              where: { id: b.groupTripId },
              data:  { reservedSpots: { decrement: b.numberOfSeats } },
            });

            // Reopen trip if it was FULL
            await tx.groupTrip.updateMany({
              where: { id: b.groupTripId, status: "FULL" },
              data:  { status: "PUBLISHED" },
            });
          }
        });
        expired++;
      } catch (e) {
        errors++;
        console.error(`[expireStale] booking ${b.id}:`, e);
      }
    }

    return { expired, errors };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Demo payment (dev/staging only) — same atomic pattern as Stripe
  // ───────────────────────────────────────────────────────────────────────────

  static async confirmDemoPayment(bookingId: string, _userId?: string) {
    const { isDemoPaymentsAllowed } = await import("@/lib/payments-config");
    if (!isDemoPaymentsAllowed()) {
      throw new Error(
        "Paiement démo désactivé en production. Configurez Stripe ou ALLOW_DEMO_PAYMENTS."
      );
    }

    return prisma.$transaction(
      async (tx) => {
        // Atomic claim — same pattern as Stripe webhook
        const claimed = await tx.booking.updateMany({
          where: { id: bookingId, status: "PENDING_PAYMENT" },
          data:  { status: "CONFIRMED" },
        });

        if (claimed.count === 0) {
          const b = await tx.booking.findFirst({
            where: { id: bookingId },
            include: { groupTrip: true, agency: true },
          });
          if (!b) throw new Error("Réservation introuvable.");
          if (b.status === "CONFIRMED") return this.formatBookingSummary(b);
          throw new Error("Réservation non disponible (expirée ou annulée).");
        }

        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { groupTrip: true, agency: true },
        });
        if (!booking) throw new Error("Réservation introuvable.");

        // Lock trip, update spots
        await tx.$queryRaw`
          SELECT id FROM "GroupTrip"
          WHERE id = ${booking.groupTripId}
          FOR UPDATE
        `;

        const updatedTrip = await tx.groupTrip.update({
          where: { id: booking.groupTripId },
          data: {
            bookedSpots:   { increment: booking.numberOfSeats },
            reservedSpots: { decrement: booking.numberOfSeats },
          },
        });

        if (updatedTrip.bookedSpots >= updatedTrip.totalSpots) {
          await tx.groupTrip.update({
            where: { id: booking.groupTripId },
            data: { status: "FULL" },
          });
        }

        const summary = this.formatBookingSummary(booking);
        await this.sendConfirmationEmails(booking.id);

        const { AuditLogService } = await import("@/services/audit-log.service");
        await AuditLogService.record(
          "BOOKING_CONFIRMED",
          { bookingId: booking.id, confirmationCode: booking.confirmationCode, source: "demo" },
          _userId
        );

        return summary;
      },
      { timeout: 15_000, maxWait: 5_000 }
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Email helpers
  // ───────────────────────────────────────────────────────────────────────────

  static async notifyCancellationEmails(bookingId: string) {
    try {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { groupTrip: true, agency: true },
      });
      if (!b || b.status !== "CANCELLED") return;

      await sendClientCancellationEmail({
        to: b.clientEmail,
        clientName: b.clientName,
        tripTitle: b.groupTrip.title,
        confirmationCode: b.confirmationCode,
      });
      await sendAgencyClientCancelledEmail({
        to: b.agency.email,
        agencyName: b.agency.name,
        tripTitle: b.groupTrip.title,
        clientName: b.clientName,
        confirmationCode: b.confirmationCode,
      });
      const { sendAdminRefundPendingEmail } = await import("@/lib/booking-emails");
      await sendAdminRefundPendingEmail({
        tripTitle: b.groupTrip.title,
        clientName: b.clientName,
        confirmationCode: b.confirmationCode,
        amount: Math.round(Number(b.depositPaid)),
      });
    } catch (e) {
      console.error("Cancellation emails:", e);
    }
  }

  static async sendConfirmationEmails(
    bookingId: string,
    options?: { force?: boolean }
  ) {
    return this.ensureConfirmationEmailsSent(bookingId, options);
  }

  static async ensureConfirmationEmailsSent(
    bookingId: string,
    options?: { force?: boolean }
  ): Promise<{ sent: boolean; alreadySent: boolean; to: string }> {
    const b = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { groupTrip: true, agency: true, payment: true },
    });
    if (!b) throw new Error("Réservation introuvable.");
    if (b.status !== "CONFIRMED") {
      throw new Error("Seules les réservations confirmées peuvent recevoir l'email.");
    }

    if (b.confirmationEmailSentAt && !options?.force) {
      return { sent: false, alreadySent: true, to: b.clientEmail };
    }

    const deposit = Math.round(Number(b.depositPaid));
    const total   = Math.round(Number(b.totalAmount));

    try {
      await sendBookingConfirmationEmail({
        to: b.clientEmail,
        clientName: b.clientName,
        confirmationCode: b.confirmationCode,
        tripTitle: b.groupTrip.title,
        destination: b.groupTrip.destination,
        startDate: formatFrDate(b.groupTrip.startDate),
        endDate: formatFrDate(b.groupTrip.endDate),
        depositPaid: deposit,
        totalAmount: total,
        remainingOnSite: Math.max(0, total - deposit),
        agencyName: b.agency.name,
        agencyEmail: b.agency.email,
        agencyPhone: b.agency.phoneNumber,
        meetingPoint: b.groupTrip.meetingPoint,
        cancellationToken: b.cancellationToken,
      });
      if (b.agency.notifyBookingsEmail) {
        await sendAgencyNewBookingEmail({
          to: b.agency.email,
          agencyName: b.agency.name,
          tripTitle: b.groupTrip.title,
          clientName: b.clientName,
          clientEmail: b.clientEmail,
          clientPhone: b.clientPhone,
          numberOfSeats: b.numberOfSeats,
          depositPaid: deposit,
          confirmationCode: b.confirmationCode,
        });
      }
      if (
        b.agency.notifyPaymentsEmail &&
        b.payment?.payoutMode === "connect" &&
        b.payment.status === "SUCCEEDED"
      ) {
        const { sendAgencyConnectPayoutEmail } = await import("@/lib/agency-emails");
        const grossCents = Math.round(Number(b.payment.amount) * 100);
        await sendAgencyConnectPayoutEmail({
          agencyEmail: b.agency.email,
          agencyName: b.agency.name,
          tripTitle: b.groupTrip.title,
          confirmationCode: b.confirmationCode,
          grossCents,
          platformFeeCents: b.payment.platformFeeCents,
          agencyNetCents: b.payment.agencyNetCents,
          currency: b.payment.currency,
        });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { confirmationEmailSentAt: new Date() },
      });

      return { sent: true, alreadySent: false, to: b.clientEmail };
    } catch (e) {
      console.error("Confirmation emails:", e);
      throw e instanceof Error ? e : new Error("Envoi d'email impossible.");
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public read helpers
  // ───────────────────────────────────────────────────────────────────────────

  static async getPublicByStripeSession(stripeSessionId: string) {
    if (!stripeSessionId) throw new Error("Session Stripe manquante.");

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId },
      include: {
        booking: { include: { groupTrip: true, agency: true } },
      },
    });

    if (payment?.booking.status === "CONFIRMED") {
      try {
        await this.ensureConfirmationEmailsSent(payment.booking.id);
      } catch (e) {
        console.error("Confirmation email on lookup:", e);
      }
      return this.formatBookingSummary(payment.booking);
    }

    const { stripe } = await import("@/lib/stripe");
    if (!stripe) throw new Error("Stripe non configuré.");

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (session.payment_status !== "paid") {
      throw new Error("Paiement non finalisé.");
    }

    const result = await this.confirmFromStripeSession(stripeSessionId, {
      bookingId:    session.metadata?.bookingId    || "",
      groupTripId:  session.metadata?.groupTripId  || "",
      agencyId:     session.metadata?.agencyId     || "",
      clientEmail:  session.metadata?.clientEmail  || session.customer_email || "",
      numberOfSeats: session.metadata?.numberOfSeats || "1",
    });

    if (!result.alreadyProcessed && "bookingId" in result && result.bookingId) {
      try {
        await this.ensureConfirmationEmailsSent(result.bookingId);
      } catch (e) {
        console.error("Confirmation email after Stripe session:", e);
      }
    }

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) throw new Error("Réservation introuvable.");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { groupTrip: true, agency: true },
    });
    if (!booking) throw new Error("Réservation introuvable.");
    return this.formatBookingSummary(booking);
  }

  static formatBookingSummary(
    booking: {
      id: string;
      confirmationCode: string;
      depositPaid: unknown;
      totalAmount: unknown;
      numberOfSeats: number;
      status: string;
      groupTrip: {
        title: string;
        destination: string;
        startDate: Date;
        endDate: Date;
        coverImage: string;
        depositAmount: unknown;
        totalPrice: unknown;
        slug: string;
      };
      agency: {
        name: string;
        email: string;
        phoneNumber: string;
      };
    }
  ) {
    const deposit = Number(booking.depositPaid);
    const total   = Number(booking.totalAmount);
    return {
      id:               booking.id,
      confirmationCode: booking.confirmationCode,
      tripTitle:        booking.groupTrip.title,
      destination:      booking.groupTrip.destination,
      startDate:        booking.groupTrip.startDate.toISOString(),
      endDate:          booking.groupTrip.endDate.toISOString(),
      coverImage:       booking.groupTrip.coverImage,
      depositAmount:    deposit,
      totalPrice:       total,
      numberOfSeats:    booking.numberOfSeats,
      status:           booking.status,
      agencyName:       booking.agency.name,
      agencyEmail:      booking.agency.email,
      agencyPhone:      booking.agency.phoneNumber,
      tripSlug:         booking.groupTrip.slug,
    };
  }

  static async getByIdForUser(bookingId: string, userId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { groupTrip: true, agency: true },
    });
    if (!booking) return null;
    return this.formatBookingSummary(booking);
  }

  static async getByIdPublic(bookingId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, status: "CONFIRMED" },
      include: { groupTrip: true, agency: true },
    });
    if (!booking) return null;
    return this.formatBookingSummary(booking);
  }

  static async finalizeFromStripeSession(stripeSessionId: string, _userId: string) {
    return this.getPublicByStripeSession(stripeSessionId);
  }

  static async listForUser(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        groupTrip: {
          select: {
            title: true, destination: true, startDate: true, endDate: true,
          },
        },
        agency: { select: { name: true } },
      },
    });

    return bookings.map((b) => ({
      id:               b.id,
      confirmationCode: b.confirmationCode,
      tripTitle:        b.groupTrip.title,
      destination:      b.groupTrip.destination,
      startDate:        b.groupTrip.startDate.toISOString(),
      endDate:          b.groupTrip.endDate.toISOString(),
      seats:            b.numberOfSeats,
      depositPaid:      Number(b.depositPaid),
      totalAmount:      Number(b.totalAmount),
      status:           b.status,
      agency:           b.agency.name,
      bookedAt:         b.createdAt.toISOString(),
    }));
  }

  static async getInvoice(confirmationCode: string, userId: string, role: string) {
    const booking = await prisma.booking.findUnique({
      where: { confirmationCode },
      include: { groupTrip: true, agency: true, payment: true },
    });

    if (!booking) throw new Error("Réservation introuvable.");
    if (role !== "ADMIN" && booking.userId !== userId) {
      throw new Error("Accès refusé.");
    }
    if (!["CONFIRMED", "CANCELLED", "REFUNDED"].includes(booking.status)) {
      throw new Error("Reçu disponible après confirmation du paiement.");
    }

    const statusLabels: Record<string, string> = {
      CONFIRMED: "Confirmée",
      CANCELLED: "Annulée",
      REFUNDED:  "Remboursée",
    };

    const fmt = (n: number) =>
      `${Math.round(n).toLocaleString("fr-FR")} ${booking.groupTrip.currency || "EUR"}`;

    return {
      id: booking.id,
      confirmationCode: booking.confirmationCode,
      issuedAt:         formatFrDate(new Date()),
      tripTitle:        booking.groupTrip.title,
      destination:      booking.groupTrip.destination,
      dates:            `${formatFrDate(booking.groupTrip.startDate)} → ${formatFrDate(booking.groupTrip.endDate)}`,
      clientName:       booking.clientName,
      clientEmail:      booking.clientEmail,
      agencyName:       booking.agency.name,
      seats:            booking.numberOfSeats,
      depositPaid:      fmt(Number(booking.depositPaid)),
      totalAmount:      fmt(Number(booking.totalAmount)),
      statusLabel:      statusLabels[booking.status] || booking.status,
      paidAt:           booking.payment?.paidAt
                          ? formatFrDate(booking.payment.paidAt)
                          : formatFrDate(booking.createdAt),
    };
  }
}
