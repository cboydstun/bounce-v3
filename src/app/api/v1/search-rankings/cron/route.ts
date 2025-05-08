import { NextRequest, NextResponse } from "next/server";
import { checkAllKeywordRankings } from "@/utils/scheduledTasks";
import dbConnect from "@/lib/db/mongoose";

/**
 * GET /api/v1/search-rankings/cron
 * Cron job endpoint to check all keyword rankings
 * This endpoint is called by Vercel's cron job scheduler at 8 AM Central Time (13:00 UTC) every day
 */
export async function GET(req: NextRequest) {
  try {
    // Verify that the request is coming from Vercel's cron job scheduler
    // or from an authorized source (e.g., with a secret token)
    const authHeader = req.headers.get("authorization");

    // In production, you should use a more secure authentication method
    // For now, we'll allow the cron job to run without authentication in development
    if (process.env.NODE_ENV === "production" && !authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Run the ranking check
    await checkAllKeywordRankings();

    return NextResponse.json({
      message: "Ranking check completed successfully",
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { message: "Failed to run ranking check" },
      { status: 500 },
    );
  }
}
