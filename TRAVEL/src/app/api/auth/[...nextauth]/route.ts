import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Demo Fallback for Frontend Demonstration
        if (credentials.email === "client@test.com" && credentials.password === "client123") {
          return {
            id: "cl-demo-123",
            name: "Jean Client (Demo)",
            email: "client@test.com",
            role: "CLIENT",
          };
        }

        if (credentials.email === "admin@maghrebvoyage.com" && credentials.password === "admin123") {
          return {
            id: "ad-demo-456",
            name: "Admin Maghreb (Demo)",
            email: "admin@maghrebvoyage.com",
            role: "ADMIN",
          };
        }

        if (credentials.email === "agency@test.com" && credentials.password === "agency123") {
          return {
            id: "ag-demo-789",
            name: "Sahara Explorer (Demo Agency)",
            email: "agency@test.com",
            role: "AGENCY",
          };
        }

        try {
          // --- FRONTEND-ONLY MODE (DATABASE DISABLED) ---
          /* 
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.passwordHash) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isPasswordValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
          */
          
          // Return null if not one of the demo accounts above
          return null;

        } catch (error) {
          console.error("Auth Error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "CLIENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
