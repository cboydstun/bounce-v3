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

/**
 * Phase 2: Token Verification (Logging Only)
 * This middleware verifies tokens but only logs the results without enforcing authentication
 */
export async function middleware(request: NextRequest) {
  // Log basic request information
  debugLog('Request received', { 
    path: request.nextUrl.pathname,
    method: request.method,
    hasAuthCookie: !!request.cookies.get('next-auth.session-token'),
  });

  try {
    // Get token but don't enforce authentication yet
    debugLog('Attempting token verification...');
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });
    
    // Log detailed token verification results
    debugLog('Token verification result', { 
      hasToken: !!token,
      tokenId: token?.id ? 'exists' : 'missing',
      tokenSub: token?.sub ? 'exists' : 'missing',
      tokenExp: typeof token?.exp === 'number' ? new Date(token.exp * 1000).toISOString() : 'missing',
      path: request.nextUrl.pathname
    });
    
    // Log all cookies for debugging (without values for security)
    const cookieNames = request.cookies.getAll().map(c => c.name);
    debugLog('Cookies present during token verification', {
      cookieCount: cookieNames.length,
      cookieNames,
      hasSessionToken: cookieNames.includes('next-auth.session-token'),
    });
    
    // Allow all requests to proceed regardless of token
    debugLog('Phase 2: Token verification complete - allowing all requests');
    return NextResponse.next();
  } catch (error) {
    // Log any errors during token verification
    debugLog('Token verification error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Still allow the request to proceed
    debugLog('Phase 2: Despite token verification error - allowing request');
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
