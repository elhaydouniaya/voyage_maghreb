"use client";

import { useEffect, useRef } from "react";
import { trackBehaviorEvent } from "@/components/analytics/BehaviorTracker";

export default function ReceiptTracker({ code }: { code: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackBehaviorEvent("BOOKING_CONFIRMED", { confirmationCode: code });
  }, [code]);

  return null;
}
