import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isGoogleOAuthEnabled } from "@/lib/oauth";

const DEMO_ACCOUNTS = [
  { email: "client@test.com", password: "client123", role: "CLIENT" as const },
  { email: "admin@maghrebvoyage.com", password: "admin123", role: "ADMIN" as const },
  { email: "agency@test.com", password: "agency123", role: "AGENCY" as const },
];

function isDemoAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_LOGIN === "true"
  );
}

const authProviders: NextAuthOptions["providers"] = [];

if (isGoogleOAuthEnabled()) {
  authProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

authProviders.push(
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();
        if (!email || !password) return null;

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (user?.passwordHash) {
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (isPasswordValid) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
              } as any;
            }
          }

          if (isDemoAuthEnabled()) {
            const demo = DEMO_ACCOUNTS.find((d) => d.email === email && d.password === password);
            if (demo && user) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
              } as any;
            }
          }
        } catch (error) {
          console.error("Auth Error:", error);
        }

        return null;
      },
    })
);

async function ensureGoogleUser(
  email: string,
  name: string | null | undefined,
  image: string | null | undefined,
  account: {
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
  }
) {
  const normalized = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });

  if (existing && existing.role !== "CLIENT") {
    return { ok: false as const, reason: "role" as const };
  }

  const dbUser =
    existing ??
    (await prisma.user.create({
      data: {
        email: normalized,
        name: name || "Voyageur",
        image: image ?? undefined,
        role: "CLIENT",
        emailVerified: new Date(),
      },
    }));

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    create: {
      userId: dbUser.id,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token ?? undefined,
      access_token: account.access_token ?? undefined,
      expires_at: account.expires_at ?? undefined,
      token_type: account.token_type ?? undefined,
      scope: account.scope ?? undefined,
      id_token: account.id_token ?? undefined,
    },
    update: {
      access_token: account.access_token ?? undefined,
      refresh_token: account.refresh_token ?? undefined,
      expires_at: account.expires_at ?? undefined,
    },
  });

  return { ok: true as const, user: dbUser };
}

export const authOptions: NextAuthOptions = {
  providers: authProviders,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const result = await ensureGoogleUser(
        email,
        user.name,
        user.image,
        {
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
        }
      );

      if (!result.ok) {
        return "/login?error=google_role";
      }

      user.id = result.user.id;
      (user as { role?: string }).role = result.user.role;
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // When user first logs in via credentials
      if (user) {
        token.id = user.id;
        const userRole = (user as { role?: string }).role as "CLIENT" | "AGENCY" | "ADMIN" | undefined;
        token.role = userRole || "CLIENT";
        token.email = user.email;
        if (user.name) token.name = user.name;
        token.picture = (user as { image?: string | null }).image ?? null;

        // Charger le statut de vérification de l'agence dans le JWT
        if (token.role === "AGENCY" && user.id) {
          try {
            const agency = await prisma.agency.findUnique({
              where: { userId: user.id },
              select: { verificationStatus: true },
            });
            token.agencyVerificationStatus = agency?.verificationStatus ?? undefined;
          } catch { /* ignore */ }
        }

        if (token.role) return token; // Exit early with populated token
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name as string;
      }

      if (trigger === "update" && session && "image" in session) {
        token.picture = (session.image as string | null) ?? null;
      }

      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true, name: true, email: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // Ensure role is always set from database
      const userId = (token.sub || token.id) as string | undefined;
      if (userId && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, name: true, email: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        } catch {
          /* ignore */
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = (token.id as string) || token.sub || "";
        const tokenRole = token.role as "CLIENT" | "AGENCY" | "ADMIN" | undefined;
        session.user.role = tokenRole || "CLIENT";
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        session.user.image = (token.picture as string | null | undefined) ?? null;
        if (token.agencyVerificationStatus) {
          (session.user as { agencyVerificationStatus?: string }).agencyVerificationStatus =
            token.agencyVerificationStatus as string;
        }
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
