import prisma from "@/lib/prisma";
import { sendPartnerNewsletterEmail } from "@/lib/agency-emails";

export type PartnerNewsletterResult = {
  sent: number;
  skipped: number;
  total: number;
  errors: string[];
};

/** Newsletter partenaires — agences avec notifyPartnerNewsletter activé. */
export class PartnerNewsletterService {
  static async buildDigest() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [newTrips, confirmedBookings, aiLeads, publishedTrips] = await Promise.all([
      prisma.groupTrip.count({
        where: {
          status: "PUBLISHED",
          createdAt: { gte: since },
        },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { gte: since } },
      }),
      prisma.agencyLead.count({
        where: { createdAt: { gte: since } },
      }),
      prisma.groupTrip.count({ where: { status: { in: ["PUBLISHED", "FULL"] } } }),
    ]);

    return {
      periodDays: 30,
      newTrips,
      confirmedBookings,
      aiLeads,
      publishedTrips,
    };
  }

  static async sendToOptedInAgencies(): Promise<PartnerNewsletterResult> {
    const digest = await this.buildDigest();

    const agencies = await prisma.agency.findMany({
      where: {
        notifyPartnerNewsletter: true,
        verificationStatus: "VERIFIED",
      },
      select: {
        id: true,
        email: true,
        name: true,
        managerName: true,
      },
    });

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const agency of agencies) {
      if (!agency.email?.trim()) {
        skipped++;
        continue;
      }

      try {
        await sendPartnerNewsletterEmail({
          agencyEmail: agency.email,
          agencyName: agency.name,
          managerName: agency.managerName || agency.name,
          digest,
        });
        sent++;
      } catch (e) {
        errors.push(
          `${agency.name}: ${e instanceof Error ? e.message : "erreur envoi"}`
        );
      }
    }

    return { sent, skipped, total: agencies.length, errors };
  }
}
