import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (pathname.startsWith("/reception")) {
      if (role !== "ADMIN" && role !== "RECEPTIONIST") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/admin")) {
          return token?.role === "ADMIN";
        }
        if (pathname.startsWith("/reception")) {
          return token?.role === "ADMIN" || token?.role === "RECEPTIONIST";
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/reception/:path*"],
};
