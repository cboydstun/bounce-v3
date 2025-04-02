import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  });

  const isAuthenticated = !!token;

  // Define protected paths
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  // Define which API paths require authentication
  // Public API paths that don't require authentication
  const publicApiPaths = [
    "/api/v1/products",
    "/api/v1/users/login",
    "/api/v1/reviews",
    "/api/v1/blogs", // Base blogs endpoint
  ];

  // Check if the path is a blog detail route
  const isBlogDetailPath = request.nextUrl.pathname.match(
    /^\/api\/v1\/blogs\/[^\/]+$/,
  );

  // Check if the current path is a protected API path
  const isProtectedApiPath =
    request.nextUrl.pathname.startsWith("/api/v1") &&
    !publicApiPaths.some((path) => request.nextUrl.pathname.startsWith(path)) &&
    !isBlogDetailPath; // Allow blog detail routes

  // Check authentication for protected routes
  if ((isAdminPath || isProtectedApiPath) && !isAuthenticated) {
    // Redirect to login page with callback URL
    const url = new URL(`/login`, request.url);
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Role-based access control has been removed
  // Any authenticated user can now access admin routes

  return NextResponse.next();
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
    // Match protected API routes
    "/api/v1/:path*",
  ],
};
