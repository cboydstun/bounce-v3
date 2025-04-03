import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[AUTH MIDDLEWARE DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

// Log environment variables (without exposing secrets)
debugLog("Environment check", {
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
  debugLog("withAuth middleware called", {
    path: req.nextUrl.pathname,
    method: req.method,
  });

  try {
    // Check if user is already set (for testing purposes)
    if ((req as AuthRequest).user) {
      debugLog("User already set on request (test mode)");
      return await handler(req as AuthRequest);
    }

    // Try multiple authentication methods
    debugLog("Trying multiple authentication methods...");

    // Method 1: Try to get the session from the server session
    debugLog("Method 1: Trying getServerSession...");
    const session = await getServerSession(authOptions);

    // If we have a valid session, use it
    if (session?.user?.id) {
      debugLog("Valid NextAuth.js server session found", {
        userId: session.user.id,
        userEmail: session.user.email || "missing",
      });

      // Add user to request
      const authReq = req as AuthRequest;
      authReq.user = {
        id: session.user.id,
        email: session.user.email || "",
        role: undefined, // Role has been removed from session
      };

      debugLog("User added to request from server session");
      return await handler(authReq);
    }

    // Method 2: Try to get the token directly from the request cookies
    debugLog("Method 2: Trying getToken...");
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    if (token?.id) {
      debugLog("Valid NextAuth.js token found", {
        tokenId: token.id,
        tokenSub: token.sub || "missing",
      });

      // Add user to request
      const authReq = req as AuthRequest;
      authReq.user = {
        id: token.id,
        email: token.email as string || "",
        role: undefined, // Role has been removed from token
      };

      debugLog("User added to request from token");
      return await handler(authReq);
    }

    // Method 3: Try to get the user ID from the Authorization header
    debugLog("Method 3: Checking Authorization header...");
    const authHeader = req.headers.get("Authorization");
    debugLog("Checking Authorization header", {
      hasAuthHeader: !!authHeader,
      authHeader: authHeader || "none"
    });

    if (authHeader) {
      // Extract the token from the Authorization header
      // Format: "Bearer <userId>"
      const token = authHeader.replace("Bearer ", "");

      if (token) {
        debugLog("User ID extracted from Authorization header", { token });

        // Add user to request
        const authReq = req as AuthRequest;
        authReq.user = {
          id: token,
          email: "", // We don't have the email from the token
          role: undefined,
        };

        debugLog("User added to request from Authorization header");
        return await handler(authReq);
      }
    }

    // If we get here, no valid authentication was found
    debugLog("No valid authentication found");
    return NextResponse.json(
      { error: "Unauthorized - Not authenticated" },
      { status: 401 },
    );
  } catch (error) {
    debugLog("Auth middleware error", { error });
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Unauthorized - Authentication error" },
      { status: 401 },
    );
  }
}
