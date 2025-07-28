import { NextRequest, NextResponse } from "next/server";
import {
  createRankingBatches,
  processNextBatch,
  getBatchStatus,
  cleanupOldBatches,
} from "@/utils/batchProcessor";
import dbConnect from "@/lib/db/mongoose";
import { getCurrentDateCT } from "@/utils/dateUtils";
import { getToken } from "next-auth/jwt";

// Keep 60 seconds limit - batch processing will work within this constraint
export const maxDuration = 60;

/**
 * GET /api/v1/search-rankings/cron
 * Batch processing cron job endpoint for keyword rankings
 *
 * This endpoint handles two types of operations:
 * 1. Daily batch creation (triggered at 8 AM Central Time)
 * 2. Batch processing (triggered every 10 minutes to process batches)
 *
 * Query parameters:
 * - action: 'create' to create new batches, 'process' to process next batch, 'status' to get status
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
          `🚀 Creating new ranking batches at ${currentTime.toISOString()}`,
        );

        // Clean up old batches first
        await cleanupOldBatches();

        // Create new batches for all active keywords
        result = await createRankingBatches();
        console.log(`📦 Batch creation result:`, result);
        break;

      case "process":
        console.log(
          `⚡ Processing next ranking batch at ${currentTime.toISOString()}`,
        );

        // Process the next available batch
        result = await processNextBatch();
        console.log(`🔄 Batch processing result:`, result);
        break;

      case "status":
        console.log(`📊 Getting batch status at ${currentTime.toISOString()}`);

        // Get current batch status
        result = await getBatchStatus();
        console.log(`📈 Batch status:`, result);
        break;

      default:
        throw new Error(
          `Invalid action: ${action}. Use 'create', 'process', or 'status'`,
        );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      message: `Batch ${action} completed successfully`,
      action,
      timestamp: currentTime.toISOString(),
      duration: `${duration}ms`,
      authMethod,
      result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error in batch cron job after ${duration}ms:`, error);

    return NextResponse.json(
      {
        message: "Failed to run batch operation",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentTime.toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}
