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
 * Phase 3: Enforce Admin Authentication Only
 * This middleware enforces authentication for admin routes only
 */
export async function middleware(request: NextRequest) {
  // Log basic request information
  debugLog('Request received', { 
    path: request.nextUrl.pathname,
    method: request.method,
    hasAuthCookie: !!request.cookies.get('next-auth.session-token'),
  });

  try {
    // Get token from NextAuth.js
    debugLog('Verifying authentication token...');
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });
    
    // Determine authentication status
    const isAuthenticated = !!token;
    const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
    
    // Log authentication status
    debugLog('Authentication status', { 
      isAuthenticated,
      isAdminPath,
      tokenId: token?.id ? 'exists' : 'missing',
      path: request.nextUrl.pathname
    });
    
    // Only enforce authentication for admin routes
    if (isAdminPath && !isAuthenticated) {
      // Redirect to login page with callback URL
      const url = new URL(`/login`, request.url);
      url.searchParams.set("from", request.nextUrl.pathname);
      
      debugLog('Redirecting to login', { 
        from: request.nextUrl.pathname,
        redirectUrl: url.toString()
      });
      
      return NextResponse.redirect(url);
    }
    
    // Allow all other requests to proceed
    debugLog('Request allowed to proceed');
    return NextResponse.next();
  } catch (error) {
    // Log any errors during token verification
    debugLog('Middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Still allow the request to proceed on error
    debugLog('Despite error, allowing request to proceed');
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
