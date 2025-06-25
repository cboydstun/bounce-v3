import { NextRequest, NextResponse } from "next/server";
import { checkAllKeywordRankings } from "@/utils/scheduledTasks";
import dbConnect from "@/lib/db/mongoose";
import { getCurrentDateCT } from "@/utils/dateUtils";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/v1/search-rankings/cron
 * Cron job endpoint to check all keyword rankings
 * This endpoint is called by Vercel's cron job scheduler at 8 AM Central Time (13:00 UTC) every day
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const currentTime = getCurrentDateCT();

  try {
    // Enhanced authentication for cron jobs and admin users
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const userAgent = req.headers.get("user-agent");

    // Check for proper authentication
    let isAuthorized = false;
    let authMethod = "";

    if (process.env.NODE_ENV === "production") {
      // Method 1: Vercel cron job
      const isVercelCron = userAgent?.includes("vercel-cron");

      // Method 2: Manual cron trigger with secret
      const hasValidSecret = authHeader === `Bearer ${cronSecret}`;

      // Method 3: Authenticated admin user
      let isAdminUser = false;
      try {
        const token = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
        });

        if (token && token.role === "admin") {
          isAdminUser = true;
          authMethod = "admin-user";
        }
      } catch (tokenError) {
        console.log("Token validation error:", tokenError);
      }

      if (isVercelCron) {
        isAuthorized = true;
        authMethod = "vercel-cron";
      } else if (hasValidSecret) {
        isAuthorized = true;
        authMethod = "cron-secret";
      } else if (isAdminUser) {
        isAuthorized = true;
        authMethod = "admin-user";
      }

      if (!isAuthorized) {
        console.log(
          `🚫 Unauthorized cron request - User-Agent: ${userAgent}, Auth: ${authHeader ? "present" : "missing"}`,
        );
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.log(`🔧 Development mode - allowing cron request`);
      authMethod = "development";
    }

    // Connect to the database
    await dbConnect();

    // Run the enhanced ranking check
    const result = await checkAllKeywordRankings();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      message: "Ranking check completed successfully",
      timestamp: currentTime.toISOString(),
      duration: `${duration}ms`,
      authMethod,
      result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error in cron job after ${duration}ms:`, error);

    return NextResponse.json(
      {
        message: "Failed to run ranking check",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentTime.toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}
