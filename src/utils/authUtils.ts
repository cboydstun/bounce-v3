import { AuthRequest } from "@/middleware/auth";
import { NextResponse } from "next/server";

/**
 * Check if the current user is the owner of a resource or has admin privileges
 * @param req The authenticated request
 * @param resourceOwnerId The ID of the resource owner
 * @returns boolean indicating if the user has ownership rights
 */
export function checkOwnership(
  req: AuthRequest,
  resourceOwnerId: string | undefined,
): boolean {
  // Admin can access any resource
  if (req.user?.role === "admin") {
    return true;
  }

  // User can only access their own resources
  return req.user?.id === resourceOwnerId;
}

/**
 * Require ownership of a resource to proceed
 * Returns a NextResponse with 403 error if ownership check fails
 * Returns null if ownership check passes
 * @param req The authenticated request
 * @param resourceOwnerId The ID of the resource owner
 * @param resourceType The type of resource (for error message)
 */
export function requireOwnership(
  req: AuthRequest,
  resourceOwnerId: string | undefined,
  resourceType: string = "resource",
): NextResponse | null {
  if (!checkOwnership(req, resourceOwnerId)) {
    return NextResponse.json(
      { error: `Not authorized to modify this ${resourceType}` },
      { status: 403 },
    );
  }

  return null;
}
