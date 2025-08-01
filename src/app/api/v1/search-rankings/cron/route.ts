import { NextRequest, NextResponse } from "next/server";
import {
  createRankingJobs,
  processNextJob,
  getQueueStatus,
  cleanupOldJobs,
  resetStuckJobs,
  processBatchRankings,
} from "@/utils/jobQueueProcessor";
import dbConnect from "@/lib/db/mongoose";
import { getCurrentDateCT } from "@/utils/dateUtils";
import { getToken } from "next-auth/jwt";

// Keep 60 seconds limit - batch processing will work within this constraint
export const maxDuration = 60;

/**
 * GET /api/v1/search-rankings/cron
 * Job queue processing cron job endpoint for keyword rankings
 *
 * This endpoint handles multiple types of operations:
 * 1. Daily job creation (triggered at 8 AM Central Time)
 * 2. Job processing (triggered every 2 minutes to process individual jobs)
 * 3. Queue status checking and maintenance
 *
 * Query parameters:
 * - action: 'create' to create new jobs, 'process' to process next job, 'status' to get status, 'reset' to reset stuck jobs
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

    // Get action from query parameters
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "process"; // Default to 'process'

    let result;

    switch (action) {
      case "create":
        console.log(
          `🚀 Creating new ranking jobs at ${currentTime.toISOString()}`,
        );

        // Clean up old jobs first
        await cleanupOldJobs();

        // Create new jobs for all active keywords
        result = await createRankingJobs();
        console.log(`📦 Job creation result:`, result);
        break;

      case "process":
        console.log(
          `⚡ Processing next ranking job at ${currentTime.toISOString()}`,
        );

        // Process the next available job
        result = await processNextJob();
        console.log(`🔄 Job processing result:`, result);
        break;

      case "status":
        console.log(`📊 Getting queue status at ${currentTime.toISOString()}`);

        // Get current queue status
        result = await getQueueStatus();
        console.log(`📈 Queue status:`, result);
        break;

      case "reset":
        console.log(`🔄 Resetting stuck jobs at ${currentTime.toISOString()}`);

        // Reset stuck processing jobs
        result = await resetStuckJobs();
        console.log(`🔄 Reset result:`, result);
        break;

      case "batch":
        console.log(
          `🚀 Running batch ranking processing at ${currentTime.toISOString()}`,
        );

        // Process all keywords directly in a single batch
        result = await processBatchRankings();
        console.log(`📦 Batch processing result:`, result);
        break;

      default:
        throw new Error(
          `Invalid action: ${action}. Use 'create', 'process', 'status', 'reset', or 'batch'`,
        );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      message: `Job queue ${action} completed successfully`,
      action,
      timestamp: currentTime.toISOString(),
      duration: `${duration}ms`,
      authMethod,
      result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ Error in job queue operation after ${duration}ms:`,
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to run job queue operation",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentTime.toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}
