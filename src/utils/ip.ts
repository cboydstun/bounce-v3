import { NextRequest } from "next/server";

/**
 * Extract client IP address from request headers
 * @param req Next.js request object
 * @returns Client IP address or "unknown" if not found
 */
export function getClientIp(req: NextRequest): string {
  // Try to get IP from Vercel-specific headers
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, the client IP is the first one
    return forwarded.split(",")[0].trim();
  }

  // Fallback to other headers
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-client-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
