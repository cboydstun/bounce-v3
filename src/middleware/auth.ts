import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
 * Also supports Bearer token authentication as fallback
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>,
) {
  try {
    // Check if user is already set (for testing purposes)
    if ((req as AuthRequest).user) {
      return await handler(req as AuthRequest);
    }

    // Debug headers
    const authHeader = req.headers.get("Authorization");
    const userRoleHeader = req.headers.get("X-User-Role");
    const authDebugHeader = req.headers.get("X-Auth-Debug");

    // Method 1: Try to get the session from the server
    const session = await getServerSession(authOptions);

    // If we have a valid session, use it
    if (session?.user?.id) {
      // Add user to request
      const authReq = req as AuthRequest;
      authReq.user = {
        id: session.user.id,
        email: session.user.email || "",
        role: session.user.role || "customer",
      };

      return await handler(authReq);
    }

    // Method 2: Try to get the token directly from the request cookies
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    if (token?.id) {
      // Add user to request
      const authReq = req as AuthRequest;
      authReq.user = {
        id: token.id,
        email: (token.email as string) || "",
        role: (token.role as string) || "customer",
      };

      return await handler(authReq);
    }

    // Method 3: Check for Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract the token from the Authorization header
      const token = authHeader.replace("Bearer ", "");

      if (token) {
        // Add user to request
        const authReq = req as AuthRequest;
        authReq.user = {
          id: token,
          email: "", // We don't have the email from the token
        };

        // Only add role if userRoleHeader is present
        if (userRoleHeader) {
          authReq.user.role = userRoleHeader;
        }

        return await handler(authReq);
      }
    }

    // If we get here, no valid authentication was found
    console.warn("Auth middleware: No valid authentication found", {
      url: req.url,
      method: req.method,
    });

    return NextResponse.json(
      { error: "Unauthorized - Not authenticated" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Unauthorized - Authentication error" },
      { status: 401 },
    );
  }
}
