import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { isPackageDealsVisible } from "./utils/cookieUtils";

/**
 * This middleware enforces authentication and role-based access control
 */
export async function middleware(request: NextRequest) {
  // Check if the request is for the party-packages page
  if (request.nextUrl.pathname === "/party-packages") {
    // Check if the user has completed the form
    if (!isPackageDealsVisible(request.cookies)) {
      // Redirect to the coupon form
      return NextResponse.redirect(new URL("/coupon-form", request.url));
    }
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    // Determine authentication status
    const isAuthenticated = !!token;
    const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
    const userRole = (token?.role as string) || "customer";
    const isAdmin = userRole === "admin";

    // Enforce authentication for admin routes
    if (isAdminPath) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        const url = new URL(`/login`, request.url);
        url.searchParams.set("from", request.nextUrl.pathname);
        url.searchParams.set("message", "Please login to access admin area");
        return NextResponse.redirect(url);
      }

      // If authenticated but not admin, redirect to login with message
      if (!isAdmin) {
        const url = new URL(`/login`, request.url);
        url.searchParams.set("message", "Admin access required");
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
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
    "/party-packages/:path*",
  ],
};
