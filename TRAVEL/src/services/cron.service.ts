import prisma from "@/lib/prisma";
import { sendPreTripReminderEmail } from "@/lib/booking-emails";
import { resolveAccountEmailForBooking } from "@/lib/account-email";

function formatFrDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** E14 — Rappel 7 jours avant le départ (réservations CONFIRMED). */
export class CronService {
  static async sendPreTripReminders() {
    const now = new Date();
    const target = new Date(now);
    target.setDate(target.getDate() + 7);

    const dayStart = new Date(target);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(target);
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        preTripReminderSentAt: null,
        groupTrip: {
          status: { in: ["PUBLISHED", "FULL"] },
          startDate: { gte: dayStart, lte: dayEnd },
        },
      },
      include: {
        groupTrip: true,
        agency: true,
      },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const b of bookings) {
      try {
        const to = await resolveAccountEmailForBooking(b);
        await sendPreTripReminderEmail({
          to,
          clientName: b.clientName,
          tripTitle: b.groupTrip.title,
          destination: b.groupTrip.destination,
          startDate: formatFrDate(b.groupTrip.startDate),
          meetingPoint: b.groupTrip.meetingPoint,
          agencyName: b.agency.name,
          agencyPhone: b.agency.phoneNumber,
        });

        await prisma.booking.update({
          where: { id: b.id },
          data: { preTripReminderSentAt: new Date() },
        });
        sent++;
      } catch (e) {
        errors.push(
          `${b.confirmationCode}: ${e instanceof Error ? e.message : "erreur"}`
        );
      }
    }

    return { sent, total: bookings.length, errors };
  }
}
