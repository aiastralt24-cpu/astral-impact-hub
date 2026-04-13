import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/projects",
  "/updates",
  "/vendors",
  "/media",
  "/content",
  "/distribution",
  "/analytics",
  "/settings"
];

export function middleware(request: NextRequest) {
  if (protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    const hasSession = request.cookies.has("astral-session-user");
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/updates/:path*", "/vendors/:path*", "/media/:path*", "/content/:path*", "/distribution/:path*", "/analytics/:path*", "/settings/:path*"]
};
