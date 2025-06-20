import { NextRequest, NextResponse } from "next/server";
import { checkAllKeywordRankings } from "@/utils/scheduledTasks";
import dbConnect from "@/lib/db/mongoose";
import { getCurrentDateCT } from "@/utils/dateUtils";

/**
 * GET /api/v1/search-rankings/cron
 * Cron job endpoint to check all keyword rankings
 * This endpoint is called by Vercel's cron job scheduler at 8 AM Central Time (13:00 UTC) every day
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const currentTime = getCurrentDateCT();

  console.log(`🕐 Cron job triggered at ${currentTime.toISOString()}`);

  try {
    // Enhanced authentication for cron jobs
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const userAgent = req.headers.get("user-agent");

    // Check for proper authentication
    if (process.env.NODE_ENV === "production") {
      // In production, require either:
      // 1. Authorization header with cron secret
      // 2. Vercel cron user agent
      const isVercelCron = userAgent?.includes("vercel-cron");
      const hasValidSecret = authHeader === `Bearer ${cronSecret}`;

      if (!isVercelCron && !hasValidSecret) {
        console.log(
          `🚫 Unauthorized cron request - User-Agent: ${userAgent}, Auth: ${authHeader ? "present" : "missing"}`,
        );
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      console.log(
        `✅ Authorized cron request - Vercel: ${isVercelCron}, Secret: ${hasValidSecret}`,
      );
    } else {
      console.log(`🔧 Development mode - allowing cron request`);
    }

    // Connect to the database
    console.log(`🔌 Connecting to database...`);
    await dbConnect();

    // Run the enhanced ranking check
    console.log(`🚀 Starting automated ranking check...`);
    const result = await checkAllKeywordRankings();

    const duration = Date.now() - startTime;
    console.log(`⏱️ Cron job completed in ${duration}ms`);

    return NextResponse.json({
      message: "Ranking check completed successfully",
      timestamp: currentTime.toISOString(),
      duration: `${duration}ms`,
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
