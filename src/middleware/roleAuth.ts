import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
    // First authenticate the user
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    // Check if user has the required role
    // Admin role has access to all routes
    if (
      session.user.role !== requiredRole &&
      !(requiredRole === "customer" && session.user.role === "admin")
    ) {
      return NextResponse.json(
        { error: `Unauthorized - Requires ${requiredRole} role` },
        { status: 403 },
      );
    }

    // Add user to request
    const authReq = req as AuthRequest;
    authReq.user = {
      id: session.user.id,
      email: session.user.email || "",
      role: session.user.role,
    };

    return await handler(authReq);
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
