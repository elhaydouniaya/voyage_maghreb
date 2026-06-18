import { DefaultSession } from "next-auth";

type UserRole = "CLIENT" | "AGENCY" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      /** Statut de vérification de l'agence (uniquement pour role=AGENCY) */
      agencyVerificationStatus?: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    agencyVerificationStatus?: string;
  }
}
