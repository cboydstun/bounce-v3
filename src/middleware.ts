import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { isPackageDealsVisible } from "./utils/cookieUtils";

/**
 * Phase 3: Enforce Admin Authentication Only
 * This middleware enforces authentication for admin routes only
 */
export async function middleware(request: NextRequest) {
  // Check if the request is for the party-packages page
  if (request.nextUrl.pathname === '/party-packages') {
    // Check if the user has completed the form
    if (!isPackageDealsVisible(request.cookies)) {
      // Redirect to the coupon form
      return NextResponse.redirect(new URL('/coupon-form', request.url));
    }
  }

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

// Matcher configuration
export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    // Party packages route
    "/party-packages",
    "/party-packages/:path*"
  ],
};
