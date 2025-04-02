import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`[AUTH MIDDLEWARE DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Log environment variables (without exposing secrets)
debugLog('Environment check', {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET_SET: !!process.env.JWT_SECRET,
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
 * Verifies JWT token and adds user to request object
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

    // Get token from header
    const authHeader = req.headers.get("authorization");
    debugLog('Authorization header', { 
      exists: !!authHeader,
      isBearerToken: authHeader?.startsWith("Bearer ") || false
    });
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      debugLog('No valid authorization header found');
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    debugLog('Token extracted from header', { tokenLength: token.length });

    // Verify token
    debugLog('Verifying JWT token...');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "test-secret",
    ) as {
      id: string;
      email: string;
      role?: string;
    };

    debugLog('Token verified successfully', { 
      userId: decoded.id,
      userEmail: decoded.email
    });

    // Add user to request
    const authReq = req as AuthRequest;
    authReq.user = decoded;
    debugLog('User added to request');

    // Call the handler
    debugLog('Calling route handler');
    return await handler(authReq);
  } catch (error) {
    debugLog('Auth middleware error', { error });
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Unauthorized - Invalid token" },
      { status: 401 },
    );
  }
}
