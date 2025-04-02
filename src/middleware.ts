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
 * Minimal middleware that only logs requests without enforcing authentication
 * This is a temporary version to test if the middleware is causing authentication issues
 */
export async function middleware(request: NextRequest) {
  // Log the request details
  debugLog('Request received', { 
    path: request.nextUrl.pathname,
    method: request.method,
    hasAuthCookie: !!request.cookies.get('next-auth.session-token'),
    url: request.url,
    headers: {
      // Log important headers for debugging
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'cookie-count': request.cookies.getAll().length,
    }
  });

  // Allow all requests to proceed without authentication checks
  debugLog('Middleware disabled - allowing all requests');
  return NextResponse.next();
}

// Empty matcher to prevent it from running on any routes
// We'll still log requests to understand what's happening
export const config = {
  matcher: [
    // Only match admin routes for logging purposes
    "/admin/:path*",
  ],
};
