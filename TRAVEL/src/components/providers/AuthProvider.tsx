"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Avoid CLIENT_FETCH_ERROR when `npm run dev` restarts while a tab stays open.
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      {children}
    </SessionProvider>
  );
}
