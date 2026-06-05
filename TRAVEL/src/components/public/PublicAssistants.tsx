"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import VapiVoiceButton from "@/components/ai/VapiVoiceButton";

const AIChatWidget = dynamic(() => import("@/components/ai/AIChatWidget"), {
  ssr: false,
});

/** Pages that already embed a dedicated assistant (no floating duplicate). */
function pageHasEmbeddedAssistant(pathname: string) {
  return (
    pathname.startsWith("/recherche") ||
    pathname.startsWith("/trip/") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/agency") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/booking/checkout")
  );
}

/**
 * Assistants globaux :
 * - Guide personnel (chat) flottant pour les voyageurs connectés
 * - Bouton vocal VAPI si configuré (hors pages avec assistant intégré)
 */
export default function PublicAssistants() {
  const pathname = usePathname() || "";
  const { data: session, status } = useSession();

  const isClient =
    status === "authenticated" && session?.user?.role === "CLIENT";
  const embedded = pageHasEmbeddedAssistant(pathname);

  return (
    <>
      {isClient && !embedded && <AIChatWidget variant="floating" />}
      {!embedded && <VapiVoiceButton />}
    </>
  );
}
