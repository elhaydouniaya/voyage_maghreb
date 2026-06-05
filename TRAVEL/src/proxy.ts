import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { appendCallbackToLoginPath } from "@/lib/auth-redirect";

function redirectToLogin(req: NextRequest, loginPath: string) {
  const returnTo = req.nextUrl.pathname + req.nextUrl.search;
  const url = appendCallbackToLoginPath(loginPath, returnTo);
  return NextResponse.redirect(new URL(url, req.url));
}

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      if (path.startsWith("/admin")) {
        return redirectToLogin(req, "/admin/login");
      }
      if (path.startsWith("/agency")) {
        return redirectToLogin(req, "/agency/login");
      }
      return redirectToLogin(req, "/login");
    }

    if (path.startsWith("/admin") && !path.startsWith("/admin/login") && token.role !== "ADMIN") {
      return redirectToLogin(req, "/admin/login");
    }

    if (
      path.startsWith("/agency") &&
      !path.startsWith("/agency/login") &&
      !path.startsWith("/agency/register") &&
      token.role !== "AGENCY"
    ) {
      return redirectToLogin(req, "/agency/login");
    }

    if (path.startsWith("/profile") && token.role !== "CLIENT") {
      if (token.role === "AGENCY") {
        return NextResponse.redirect(new URL("/agency/dashboard", req.url));
      }
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return redirectToLogin(req, "/login");
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin/dashboard",
    "/admin/dashboard/:path*",
    "/admin/trips",
    "/admin/trips/:path*",
    "/admin/bookings",
    "/admin/bookings/:path*",
    "/admin/payments",
    "/admin/payments/:path*",
    "/admin/ai-requests",
    "/admin/ai-requests/:path*",
    "/admin/agencies",
    "/admin/agencies/:path*",
    "/admin/clients",
    "/admin/clients/:path*",
    "/admin/reviews",
    "/admin/reviews/:path*",
    "/admin/profile",
    "/admin/profile/:path*",
    "/admin/settings",
    "/admin/settings/:path*",
    "/admin/decision-dashboard",
    "/admin/decision-dashboard/:path*",
    "/agency",
    "/agency/dashboard",
    "/agency/dashboard/:path*",
    "/agency/trips",
    "/agency/trips/:path*",
    "/agency/bookings",
    "/agency/bookings/:path*",
    "/agency/leads",
    "/agency/leads/:path*",
    "/agency/profile",
    "/agency/profile/:path*",
    "/agency/settings",
    "/agency/settings/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
