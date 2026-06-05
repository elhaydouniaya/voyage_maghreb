import type { JourneyStep } from "@prisma/client";
import { createHash } from "crypto";

export const JOURNEY_FUNNEL: { step: JourneyStep; label: string }[] = [
  { step: "PAGE_VIEW", label: "Visite" },
  { step: "SEARCH_START", label: "Recherche IA" },
  { step: "AI_MATCH_SUBMIT", label: "Match soumis" },
  { step: "TRIP_VIEW", label: "Fiche voyage" },
  { step: "CHECKOUT_START", label: "Checkout" },
  { step: "BOOKING_CONFIRMED", label: "Réservation" },
];

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function inferJourneyStepFromPath(path: string): JourneyStep | null {
  if (path.startsWith("/recherche")) return "SEARCH_START";
  if (path.startsWith("/trip/")) return "TRIP_VIEW";
  if (path.startsWith("/booking/checkout")) return "CHECKOUT_START";
  if (path.startsWith("/booking/receipt")) return "BOOKING_CONFIRMED";
  if (path.startsWith("/login")) return "LOGIN";
  if (path.startsWith("/register")) return "REGISTER";
  if (path === "/" || path.startsWith("/voyages") || path.startsWith("/profile")) {
    return "PAGE_VIEW";
  }
  return null;
}
