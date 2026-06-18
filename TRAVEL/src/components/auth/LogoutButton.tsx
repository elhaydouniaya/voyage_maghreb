"use client";

import { signOutToHome } from "@/lib/auth-client";

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => void signOutToHome()}
      className={className || "text-xs text-gray-400 hover:text-gray-600"}
    >
      Déconnexion
    </button>
  );
}
