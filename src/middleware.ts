import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`[MIDDLEWARE DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Enhanced environment variable logging (with partial secrets)
debugLog('Enhanced environment check', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
  NEXTAUTH_SECRET_PARTIAL: process.env.NEXTAUTH_SECRET ? 
    `${process.env.NEXTAUTH_SECRET.substring(0, 3)}...` : 'missing',
  JWT_SECRET_PARTIAL: process.env.JWT_SECRET ? 
    `${process.env.JWT_SECRET.substring(0, 3)}...` : 'missing',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL || 'not set',
});

/**
 * Phase 3: Enforce Admin Authentication Only
 * This middleware enforces authentication for admin routes only
 */
export async function middleware(request: NextRequest) {
  // Enhanced request and cookie logging
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map(c => c.name);
  
  debugLog('Request received', { 
    path: request.nextUrl.pathname,
    method: request.method,
    url: request.url,
    origin: request.headers.get('origin') || 'unknown',
    referer: request.headers.get('referer') || 'none',
    hasAuthCookie: !!request.cookies.get('next-auth.session-token'),
  });
  
  debugLog('Cookie details', {
    cookieCount: allCookies.length,
    cookieNames,
    hasSessionToken: cookieNames.includes('next-auth.session-token'),
    hasJWT: cookieNames.includes('next-auth.jwt-token'),
    // Check for alternative cookie names
    possibleSessionCookies: cookieNames.filter(name => 
      name.includes('auth') || name.includes('session') || name.includes('token')
    ),
  });

  try {
    // Enhanced token verification logging
    debugLog('Token verification params', {
      usingSecret: !!(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET),
      secretSource: process.env.NEXTAUTH_SECRET ? 'NEXTAUTH_SECRET' : 
                    process.env.JWT_SECRET ? 'JWT_SECRET' : 'none',
      cookiePrefix: 'next-auth',
    });
    
    // Get token from NextAuth.js with enhanced logging
    debugLog('Verifying authentication token...');
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });
    
    // Determine authentication status
    const isAuthenticated = !!token;
    const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
    
    // Enhanced authentication status logging
    debugLog('Authentication status', { 
      isAuthenticated,
      isAdminPath,
      tokenId: token?.id ? 'exists' : 'missing',
      tokenSub: token?.sub ? 'exists' : 'missing',
      tokenExp: typeof token?.exp === 'number' ? new Date(token.exp * 1000).toISOString() : 'missing',
      tokenIat: typeof token?.iat === 'number' ? new Date(token.iat * 1000).toISOString() : 'missing',
      path: request.nextUrl.pathname,
      tokenKeys: token ? Object.keys(token) : [],
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
    // Enhanced error logging
    debugLog('Middleware error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error ? error.constructor.name : 'Unknown',
      errorJSON: error ? JSON.stringify(error) : 'Not serializable',
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
