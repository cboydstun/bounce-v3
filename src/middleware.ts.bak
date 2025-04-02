import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`[MIDDLEWARE DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Log environment variables (without exposing secrets)
debugLog('Environment check', {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL_SET: !!process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
  JWT_SECRET_SET: !!process.env.JWT_SECRET,
});

export async function middleware(request: NextRequest) {
  debugLog('Middleware executing for path', { 
    path: request.nextUrl.pathname,
    method: request.method,
    hasAuthCookie: !!request.cookies.get('next-auth.session-token')
  });

  try {
    debugLog('Getting token from request...');
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    debugLog('Token result', { 
      hasToken: !!token,
      tokenId: token?.id ? 'exists' : 'missing',
      tokenSub: token?.sub ? 'exists' : 'missing'
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
      "/api/v1/visitors", // Analytics endpoint - should not require auth
    ];

    // Check if the path is a blog detail route
    const isBlogDetailPath = request.nextUrl.pathname.match(
      /^\/api\/v1\/blogs\/[^\/]+$/,
    );

    // Check if the path is an analytics-related route
    const isAnalyticsPath = 
      request.nextUrl.pathname.startsWith("/api/v1/visitors") ||
      request.nextUrl.pathname.includes("/analytics");

    // Check if the current path is a protected API path
    const isProtectedApiPath =
      request.nextUrl.pathname.startsWith("/api/v1") &&
      !publicApiPaths.some((path) => request.nextUrl.pathname.startsWith(path)) &&
      !isBlogDetailPath && // Allow blog detail routes
      !isAnalyticsPath; // Allow analytics paths

    debugLog('Path analysis', {
      isAdminPath,
      isProtectedApiPath,
      isAuthenticated,
      isBlogDetailPath: !!isBlogDetailPath,
      isAnalyticsPath,
      path: request.nextUrl.pathname
    });

    // Check authentication for protected routes
    if ((isAdminPath || isProtectedApiPath) && !isAuthenticated) {
      // Redirect to login page with callback URL
      const url = new URL(`/login`, request.url);
      url.searchParams.set("from", request.nextUrl.pathname);
      debugLog('Redirecting to login', { 
        from: request.nextUrl.pathname,
        redirectUrl: url.toString()
      });
      return NextResponse.redirect(url);
    }

    // Role-based access control has been removed
    // Any authenticated user can now access admin routes
    debugLog('Middleware allowing request to proceed');
    return NextResponse.next();
  } catch (error) {
    debugLog('Middleware error', { error });
    // On error, redirect to login as a fallback
    const url = new URL(`/login`, request.url);
    return NextResponse.redirect(url);
  }
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
    // Match specific API routes that need protection
    "/api/v1/users/:path*",
    "/api/v1/contacts/:path*",
    "/api/v1/products/admin/:path*",
    "/api/v1/reviews/admin/:path*",
    "/api/v1/blogs/admin/:path*",
  ],
};
