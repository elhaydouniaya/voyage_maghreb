import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { appendCallbackToLoginPath } from "@/lib/auth-redirect";

function redirectToLogin(req: NextRequest, loginPath: string) {
  const returnTo = req.nextUrl.pathname + req.nextUrl.search;
  const url = appendCallbackToLoginPath(loginPath, returnTo);
  return NextResponse.redirect(new URL(url, req.url));
}

const ADMIN_LOGIN = "/admin/login";
const AGENCY_LOGIN = "/agency/login";
const CLIENT_LOGIN = "/login";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      if (path.startsWith("/admin")) {
        return redirectToLogin(req, ADMIN_LOGIN);
      }
      if (
        path.startsWith("/agency") &&
        !path.startsWith("/agency/login") &&
        !path.startsWith("/agency/register")
      ) {
        return redirectToLogin(req, AGENCY_LOGIN);
      }
      return redirectToLogin(req, CLIENT_LOGIN);
    }

    const role = token.role as string;

    if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
      if (role !== "ADMIN") {
        if (role === "AGENCY") {
          return NextResponse.redirect(new URL("/agency/dashboard", req.url));
        }
        if (role === "CLIENT") {
          return NextResponse.redirect(new URL("/", req.url));
        }
        return redirectToLogin(req, ADMIN_LOGIN);
      }
    }

    if (
      path.startsWith("/agency") &&
      !path.startsWith("/agency/login") &&
      !path.startsWith("/agency/register")
    ) {
      if (role !== "AGENCY") {
        if (role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
        if (role === "CLIENT") {
          return NextResponse.redirect(new URL("/", req.url));
        }
        return redirectToLogin(req, AGENCY_LOGIN);
      }
    }

    if (path.startsWith("/profile")) {
      if (role === "AGENCY") {
        return NextResponse.redirect(new URL("/agency/dashboard", req.url));
      }
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    if (
      path.startsWith("/booking") ||
      path.startsWith("/favorites") ||
      path.startsWith("/ai")
    ) {
      if (role !== "CLIENT") {
        if (role === "AGENCY") {
          return NextResponse.redirect(new URL("/agency/dashboard", req.url));
        }
        if (role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
        return redirectToLogin(req, CLIENT_LOGIN);
      }
    }

    if (path === "/reviews/new" && role !== "CLIENT") {
      return redirectToLogin(req, CLIENT_LOGIN);
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
    "/admin/decision-dashboard",
    "/admin/decision-dashboard/:path*",
    "/admin/audit-logs",
    "/admin/audit-logs/:path*",
    "/agency/((?!login|register).*)",
    "/profile/:path*",
    "/booking/:path*",
    "/favorites/:path*",
    "/ai/:path*",
    "/reviews/new",
  ],
};
