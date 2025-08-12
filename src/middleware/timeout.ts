import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to handle request timeouts and ensure proper JSON responses
 */
export function withTimeout(
  handler: (req: NextRequest) => Promise<NextResponse>,
  timeoutMs: number = 25000,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Create a timeout promise
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timeout"));
      }, timeoutMs);
    });

    try {
      // Race between the handler and timeout
      const response = await Promise.race([handler(req), timeoutPromise]);

      return response;
    } catch (error) {
      console.error("Request timeout or error:", error);

      // Always return JSON response for timeouts
      return NextResponse.json(
        {
          error:
            error instanceof Error && error.message === "Request timeout"
              ? "Request timed out. Please try again."
              : "An error occurred processing your request.",
          timestamp: new Date().toISOString(),
          timeout:
            error instanceof Error && error.message === "Request timeout",
        },
        {
          status:
            error instanceof Error && error.message === "Request timeout"
              ? 408
              : 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  };
}

/**
 * Utility to wrap API route handlers with timeout protection
 */
export function createTimeoutHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  timeoutMs: number = 25000,
) {
  return withTimeout(handler, timeoutMs);
}
