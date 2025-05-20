import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthRequest } from "./auth";

export type Role = "admin" | "customer";

/**
 * Role-based authentication middleware for Next.js API routes
 * Verifies NextAuth.js token, checks role, and adds user to request object
 * @param req The incoming request
 * @param handler The handler function to call if authentication succeeds
 * @param requiredRole The role required to access this route
 */
export async function withRoleAuth(
  req: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>,
  requiredRole: Role,
) {
  try {
    // First use the standard auth middleware to authenticate the user
    // This will handle all authentication methods (session, token, header)
    const authReq = req.clone() as AuthRequest;

    // Debug headers
    const authHeader = req.headers.get("Authorization");
    const userRoleHeader = req.headers.get("X-User-Role");
    const authDebugHeader = req.headers.get("X-Auth-Debug");

    // Method 1: Try to get the session from the server
    const session = await getServerSession(authOptions);

    // If we have a valid session, use it
    if (session?.user?.id) {
      // Check if user has the required role
      // Admin role has access to all routes
      const userRole = session.user.role || "customer";
      if (
        userRole !== requiredRole &&
        !(requiredRole === "customer" && userRole === "admin")
      ) {
        console.warn("Role auth middleware: Insufficient role", {
          userRole,
          requiredRole,
        });

        return NextResponse.json(
          { error: `Unauthorized - Requires ${requiredRole} role` },
          { status: 403 },
        );
      }

      // Add user to request
      authReq.user = {
        id: session.user.id,
        email: session.user.email || "",
        role: userRole,
      };

      return await handler(authReq);
    }

    // Method 2: Try to get the token directly from the request cookies
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });

    if (token?.id) {
      // Check if user has the required role
      const userRole = (token.role as string) || "customer";
      if (
        userRole !== requiredRole &&
        !(requiredRole === "customer" && userRole === "admin")
      ) {
        console.warn("Role auth middleware: Insufficient role from token", {
          userRole,
          requiredRole,
        });

        return NextResponse.json(
          { error: `Unauthorized - Requires ${requiredRole} role` },
          { status: 403 },
        );
      }

      // Add user to request
      authReq.user = {
        id: token.id,
        email: (token.email as string) || "",
        role: userRole,
      };

      return await handler(authReq);
    }

    // Method 3: Check for Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract the token from the Authorization header
      const tokenValue = authHeader.replace("Bearer ", "");

      if (tokenValue) {
        // For Bearer tokens, we rely on the X-User-Role header
        const userRole = userRoleHeader || "customer";

        if (
          userRole !== requiredRole &&
          !(requiredRole === "customer" && userRole === "admin")
        ) {
          console.warn("Role auth middleware: Insufficient role from header", {
            userRole,
            requiredRole,
          });

          return NextResponse.json(
            { error: `Unauthorized - Requires ${requiredRole} role` },
            { status: 403 },
          );
        }

        // Add user to request
        authReq.user = {
          id: tokenValue,
          email: "", // We don't have the email from the token
          role: userRole,
        };

        return await handler(authReq);
      }
    }

    // If we get here, no valid authentication was found
    console.warn("Role auth middleware: No valid authentication found", {
      url: req.url,
      method: req.method,
    });

    return NextResponse.json(
      { error: "Unauthorized - Not authenticated" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Role auth middleware error:", error);
    return NextResponse.json(
      { error: "Unauthorized - Authentication error" },
      { status: 401 },
    );
  }
}

/**
 * Helper middleware for admin-only routes
 */
export function withAdminAuth(
  req: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>,
) {
  return withRoleAuth(req, handler, "admin");
}

/**
 * Helper middleware for any authenticated user
 */
export function withUserAuth(
  req: NextRequest,
  handler: (req: AuthRequest) => Promise<NextResponse>,
) {
  return withRoleAuth(req, handler, "customer");
}
