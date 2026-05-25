import { signOut } from "next-auth/react";

/** Déconnexion fiable vers l'accueil (évite les 404 NextAuth). */
export function signOutToHome() {
  const home =
    typeof window !== "undefined"
      ? `${window.location.origin}/`
      : process.env.NEXT_PUBLIC_APP_URL || "/";
  void signOut({ callbackUrl: home });
}
