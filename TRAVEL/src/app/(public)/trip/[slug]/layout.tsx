import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TripsService } from "@/services/trips.service";

/** CDC Module E — ISR 60s pour places restantes. */
export const revalidate = 60;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

type Props = {
  params: Promise<{ slug: string }>;
  children: ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await TripsService.getBySlug(slug);

  if (!trip || trip.status === "DRAFT" || trip.status === "CANCELLED") {
    return {
      title: "Voyage introuvable | MaghrebVoyage",
      robots: { index: false, follow: false },
    };
  }

  const title = `${trip.title} · ${trip.destination} | MaghrebVoyage`;
  const description =
    trip.description?.slice(0, 155).trim() ||
    `Voyage de groupe au Maghreb — ${trip.destination}. Réservez votre place avec une agence vérifiée.`;
  const image = trip.coverImage?.startsWith("http") ? trip.coverImage : undefined;
  const url = `${APP_URL}/trip/${trip.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "MaghrebVoyage",
      locale: "fr_FR",
      type: "website",
      ...(image ? { images: [{ url: image, alt: trip.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  };
}

export default function TripLayout({ children }: Props) {
  return children;
}
