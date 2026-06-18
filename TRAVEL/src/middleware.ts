import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes qui redirigent vers une page de login spécifique selon le contexte
const ADMIN_LOGIN = "/admin/login";
const AGENCY_LOGIN = "/agency/login";
const CLIENT_LOGIN = "/login";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // ─── Utilisateur non authentifié ───────────────────────────────────────
    if (!token) {
      if (path.startsWith("/admin")) {
        return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url));
      }
      if (path.startsWith("/agency") && !path.startsWith("/agency/login") && !path.startsWith("/agency/register")) {
        return NextResponse.redirect(new URL(AGENCY_LOGIN, req.url));
      }
      // Routes CLIENT protégées (booking, profil, favoris, avis, IA)
      return NextResponse.redirect(
        new URL(`${CLIENT_LOGIN}?callbackUrl=${encodeURIComponent(path)}`, req.url)
      );
    }

    const role = token.role as string;

    // ─── Espace ADMIN ──────────────────────────────────────────────────────
    if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
      if (role !== "ADMIN") {
        if (role === "AGENCY") return NextResponse.redirect(new URL("/agency/dashboard", req.url));
        if (role === "CLIENT") return NextResponse.redirect(new URL("/", req.url));
        return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url));
      }
    }

    // ─── Espace AGENCY ─────────────────────────────────────────────────────
    if (
      path.startsWith("/agency") &&
      !path.startsWith("/agency/login") &&
      !path.startsWith("/agency/register")
    ) {
      if (role !== "AGENCY") {
        if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        if (role === "CLIENT") return NextResponse.redirect(new URL("/", req.url));
        return NextResponse.redirect(new URL(AGENCY_LOGIN, req.url));
      }
    }

    // ─── Espace CLIENT (profil, réservation, IA, favoris) ─────────────────
    if (path.startsWith("/profile")) {
      if (role === "AGENCY") return NextResponse.redirect(new URL("/agency/dashboard", req.url));
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (path.startsWith("/booking") || path.startsWith("/favorites") || path.startsWith("/ai")) {
      if (role !== "CLIENT") {
        if (role === "AGENCY") return NextResponse.redirect(new URL("/agency/dashboard", req.url));
        if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        return NextResponse.redirect(new URL(CLIENT_LOGIN, req.url));
      }
    }

    // /reviews/new nécessite d'être CLIENT
    if (path === "/reviews/new") {
      if (role !== "CLIENT") {
        return NextResponse.redirect(
          new URL(`${CLIENT_LOGIN}?callbackUrl=${encodeURIComponent(path)}`, req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // On laisse passer tout le monde — la logique est dans la fonction ci-dessus
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    // Admin
    "/admin/dashboard/:path*",
    "/admin/trips/:path*",
    "/admin/bookings/:path*",
    "/admin/payments/:path*",
    "/admin/ai-requests/:path*",
    "/admin/agencies/:path*",
    "/admin/clients/:path*",
    "/admin/reviews/:path*",
    "/admin/profile/:path*",
    "/admin/settings/:path*",
    // Agency
    "/agency/((?!login|register).*)",
    // Client (authentifié requis)
    "/profile/:path*",
    "/booking/:path*",
    "/favorites/:path*",
    "/ai/:path*",
    "/reviews/new",
  ],
};
