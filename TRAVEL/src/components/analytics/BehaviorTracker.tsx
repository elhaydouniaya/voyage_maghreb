"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { inferJourneyStepFromPath } from "@/lib/behavior-events";
import { createClientSessionId } from "@/lib/client-id";

const SESSION_KEY = "mv_analytics_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = createClientSessionId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function track(step?: ReturnType<typeof inferJourneyStepFromPath>, path?: string) {
  const resolvedStep = step ?? (path ? inferJourneyStepFromPath(path) : null);
  if (!resolvedStep) return;

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step: resolvedStep,
      path: path ?? window.location.pathname,
      sessionId: getSessionId(),
    }),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}

export function trackBehaviorEvent(
  step: NonNullable<ReturnType<typeof inferJourneyStepFromPath>> | "AI_MATCH_SUBMIT" | "GUIDE_CHAT" | "CHECKOUT_START" | "BOOKING_CONFIRMED",
  metadata?: Record<string, unknown>
) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      sessionId: typeof window !== "undefined" ? getSessionId() : undefined,
      metadata,
    }),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}

export default function BehaviorTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/agency")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track(undefined, pathname);
  }, [pathname]);

  return null;
}
