import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
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

    // Method 1: Try to get the session from the server session
    const session = await getServerSession(authOptions);

    // If we have a valid session, use it
    if (session?.user?.id) {
      // Add user to request
      const authReq = req as AuthRequest;
      authReq.user = {
        id: session.user.id,
        email: session.user.email || "",
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
      };

      return await handler(authReq);
    }

    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      // Extract the token from the Authorization header
      // Format: "Bearer <userId>"
      const token = authHeader.replace("Bearer ", "");

      if (token) {
        // Add user to request
        const authReq = req as AuthRequest;
        authReq.user = {
          id: token,
          email: "", // We don't have the email from the token
        };

        return await handler(authReq);
      }
    }

    // If we get here, no valid authentication was found
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
