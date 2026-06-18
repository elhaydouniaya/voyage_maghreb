import { signOut } from "next-auth/react";

/** Déconnexion fiable vers l'accueil — contourne la validation d'URL de NextAuth. */
export async function signOutToHome() {
  await signOut({ redirect: false });
  window.location.href = "/";
}
