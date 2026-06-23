"use client";

import { useEffect, useRef } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";

function StaleSessionGuard() {
  const { data: session, status } = useSession();
  const checked = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || checked.current) return;
    checked.current = true;

    fetch("/api/user/me", { cache: "no-store" })
      .then((res) => {
        if (res.status === 404) {
          void signOut({ redirect: false });
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [status, session?.user?.id]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Avoid CLIENT_FETCH_ERROR when `npm run dev` restarts while a tab stays open.
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      <StaleSessionGuard />
      {children}
    </SessionProvider>
  );
}
