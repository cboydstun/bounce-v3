import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`[AUTH MIDDLEWARE DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Log environment variables (without exposing secrets)
debugLog('Environment check', {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
});

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

/**
 * Authentication middleware for Next.js API routes
 * Verifies NextAuth.js token and adds user to request object
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>,
) {
  debugLog('withAuth middleware called', { 
    path: req.nextUrl.pathname,
    method: req.method
  });
  
  try {
    // Check if user is already set (for testing purposes)
    if ((req as AuthRequest).user) {
      debugLog('User already set on request (test mode)');
      return await handler(req as AuthRequest);
    }

    // Get token from NextAuth.js session
    debugLog('Getting token from NextAuth.js session...');
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      debugLog('No valid NextAuth.js token found');
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    debugLog('NextAuth.js token found', { 
      tokenId: token.id ? 'exists' : 'missing',
      tokenSub: token.sub ? 'exists' : 'missing'
    });

    // Add user to request
    const authReq = req as AuthRequest;
    authReq.user = {
      id: token.id as string,
      email: token.email as string,
      role: token.role as string | undefined,
    };
    
    debugLog('User added to request from NextAuth.js token');
    return await handler(authReq);
  } catch (error) {
    debugLog('Auth middleware error', { error });
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Unauthorized - Authentication error" },
      { status: 401 },
    );
  }
}
