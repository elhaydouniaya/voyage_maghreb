import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin Route Protection
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Agency Route Protection: Only AGENCY role can access /agency/*
    if (path.startsWith("/agency") && !path.includes("/login") && !path.includes("/register")) {
      if (token?.role !== "AGENCY") {
        return NextResponse.redirect(new URL("/agency/login", req.url));
      }
    }

    // Profile/Booking Protection: Only CLIENT role can access /profile and /booking
    if ((path.startsWith("/profile") || path.startsWith("/booking")) && token?.role !== "CLIENT") {
      if (token?.role === "AGENCY") {
        return NextResponse.redirect(new URL("/agency/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/agency/dashboard/:path*",
    "/agency/trips/:path*",
    "/agency/bookings/:path*",
    "/agency/messages/:path*",
    "/agency/profile/:path*",
    "/agency/settings/:path*",
    "/profile/:path*",
    "/booking/checkout/:path*",
  ],
};
