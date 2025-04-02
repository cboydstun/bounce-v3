import { NextResponse } from "next/server";
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

/**
 * Phase 1: Basic Admin Route Logging
 * This middleware only logs requests to admin routes without enforcing authentication
 */
export async function middleware(request: NextRequest) {
  // Log detailed information about admin route requests
  debugLog('Admin route request', { 
    path: request.nextUrl.pathname,
    method: request.method,
    hasAuthCookie: !!request.cookies.get('next-auth.session-token'),
    cookies: {
      count: request.cookies.getAll().length,
      names: request.cookies.getAll().map(c => c.name),
    },
    headers: {
      referer: request.headers.get('referer'),
      'user-agent': request.headers.get('user-agent')?.substring(0, 50) + '...',
    },
    url: request.url,
  });

  // Log all cookies for debugging (without values for security)
  const cookieNames = request.cookies.getAll().map(c => c.name);
  if (cookieNames.includes('next-auth.session-token')) {
    debugLog('Session token cookie found', {
      cookieNames,
    });
  } else {
    debugLog('No session token cookie found', {
      cookieNames,
    });
  }

  // Allow all requests to proceed without authentication checks
  debugLog('Phase 1: No authentication enforcement - allowing all requests');
  return NextResponse.next();
}

// Simple matcher configuration for Phase 1
// Only target admin routes for now
export const config = {
  matcher: [
    // Only match admin routes
    "/admin/:path*",
  ],
};
