import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants/session";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Define protected and auth-only routes
  const protectedRoutes = ["/dashboard", "/trends", "/saved", "/posts", "/accounts", "/profile"];
  const authRoutes = ["/login", "/register", "/forgot-password"];

  // Check if pathname starts with or matches any protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !session) {
    // Redirect to login if trying to access a protected route without session
    const loginUrl = new URL("/login", request.url);
    // Remember the page they tried to access
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if logged in and trying to access auth pages
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run proxy on all paths except static assets, favicon, api routes, etc.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*$).*)",
  ],
};
