import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Phase 3: Enforce Admin Authentication Only
 * This middleware enforces authentication for admin routes only
 */
export async function middleware(request: NextRequest) {
  // Enhanced request and cookie logging
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map((c) => c.name);

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    // Determine authentication status
    const isAuthenticated = !!token;
    const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

    // Only enforce authentication for admin routes
    if (isAdminPath && !isAuthenticated) {
      // Redirect to login page with callback URL
      const url = new URL(`/login`, request.url);
      url.searchParams.set("from", request.nextUrl.pathname);

      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {

    return NextResponse.next();
  }
}

// Simple matcher configuration for Phase 1
// Only target admin routes for now
export const config = {
  matcher: [
    // Only match admin routes
    "/admin/:path*",
  ],
};
