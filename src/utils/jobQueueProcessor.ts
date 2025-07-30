import { SearchKeyword, SearchRanking } from "@/models";
import RankingJob from "@/models/RankingJob";
import { checkKeywordRanking } from "./googleSearchApi";
import dbConnect from "@/lib/db/mongoose";
import { sendRankingChangeNotification } from "./emailService";
import { RankingChangeNotification } from "@/types/searchRanking";
import { getCurrentDateCT } from "./dateUtils";

interface JobCreationResult {
  success: boolean;
  jobsCreated: number;
  totalKeywords: number;
  message: string;
}

interface JobProcessResult {
  success: boolean;
  jobId?: string;
  keyword?: string;
  position?: number;
  significantChange?: boolean;
  message: string;
  nextJobAvailable: boolean;
}

interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  oldestPendingJob?: Date;
  newestCompletedJob?: Date;
  estimatedTimeRemaining?: number;
}

/**
 * Creates ranking jobs for all active keywords
 * This function completes quickly (<5 seconds) and never times out
 */
export async function createRankingJobs(): Promise<JobCreationResult> {
  try {
    await dbConnect();

    // Get all active keywords
    const keywords = await SearchKeyword.findActiveKeywords();
    console.log(`📋 Found ${keywords.length} active keywords for job creation`);

    if (keywords.length === 0) {
      return {
        success: true,
        jobsCreated: 0,
        totalKeywords: 0,
        message: "No active keywords to process",
      };
    }

    // Clean up old pending/processing jobs (safety cleanup)
    const cleanupResult = await RankingJob.deleteMany({
      status: { $in: ["pending", "processing"] },
    });

    if (cleanupResult.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanupResult.deletedCount} stale jobs`);
    }

    // Create new jobs for all keywords
    const jobs = keywords.map((keyword) => ({
      keywordId: keyword._id,
      keyword: keyword.keyword,
      status: "pending" as const,
      priority: 2, // normal priority
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date(),
    }));

    const createdJobs = await RankingJob.insertMany(jobs);
    console.log(`📦 Created ${createdJobs.length} ranking jobs`);

    return {
      success: true,
      jobsCreated: createdJobs.length,
      totalKeywords: keywords.length,
      message: `Created ${createdJobs.length} ranking jobs for ${keywords.length} keywords`,
    };
  } catch (error) {
    console.error("❌ Error creating ranking jobs:", error);
    throw error;
  }
}

/**
 * Processes the next available job in the queue
 * This function processes exactly ONE job and completes within 60 seconds
 */
export async function processNextJob(): Promise<JobProcessResult> {
  const startTime = Date.now();

  try {
    await dbConnect();

    // Find and claim the next job
    const job = await (RankingJob as any).findNextJob();

    if (!job) {
      return {
        success: true,
        message: "No jobs to process - queue is empty",
        nextJobAvailable: false,
      };
    }

    console.log(
      `🔄 Processing job ${job._id} for keyword "${job.keyword}" (attempt ${job.attempts + 1}/${job.maxAttempts})`,
    );

    const targetDomain = process.env.TARGET_DOMAIN;
    if (!targetDomain) {
      await job.markAsFailed("TARGET_DOMAIN environment variable is not set");
      throw new Error("TARGET_DOMAIN environment variable is not set");
    }

    try {
      // Process the keyword with full search depth (no time pressure since it's just one job)
      const result = await checkKeywordRanking(
        job.keyword,
        targetDomain,
        50, // Full search depth - we can afford this with single job processing
      );

      // Ensure we have a valid URL
      let rankingUrl = result.url;
      if (!rankingUrl) {
        rankingUrl = targetDomain.startsWith("http")
          ? targetDomain
          : `https://${targetDomain}`;
      }

      console.log(
        `📊 Result for "${job.keyword}": Position ${result.position}, ${result.metadata.apiCallsUsed} API calls`,
      );

      // Save the ranking result
      const newRanking = await SearchRanking.create({
        keywordId: job.keywordId,
        keyword: job.keyword,
        date: new Date(),
        position: result.position,
        url: rankingUrl,
        competitors: result.competitors,
        metadata: {
          totalResults: result.metadata.totalResults,
          searchTime: result.metadata.searchTime,
          resultCount: result.metadata.resultCount,
          isValidationPassed: result.metadata.isValidationPassed,
          validationWarnings: result.metadata.validationWarnings,
          apiCallsUsed: result.metadata.apiCallsUsed,
          searchDepth: result.metadata.searchDepth,
          maxPositionSearched: result.metadata.maxPositionSearched,
        },
      });

      console.log(`💾 Saved ranking with ID: ${newRanking._id}`);

      // Check for significant changes
      let significantChange = false;
      const previousRankings = await SearchRanking.find({
        keywordId: job.keywordId,
        _id: { $ne: newRanking._id },
      })
        .sort({ date: -1 })
        .limit(1);

      if (previousRankings.length > 0) {
        const previousRanking = previousRankings[0];
        const positionChange = previousRanking.position - result.position;

        console.log(
          `📈 Position change for "${job.keyword}": ${previousRanking.position} → ${result.position} (${positionChange > 0 ? "+" : ""}${positionChange})`,
        );

        // Check if the change is significant (3 or more positions)
        if (Math.abs(positionChange) >= 3) {
          significantChange = true;
          console.log(`🚨 Significant change detected for "${job.keyword}"`);

          // Send notification for significant change
          try {
            const changeNotification: RankingChangeNotification = {
              keyword: job.keyword,
              previousPosition: previousRanking.position,
              currentPosition: result.position,
              change: positionChange,
              date: newRanking.date,
              url: newRanking.url,
            };

            await sendRankingChangeNotification([changeNotification]);
            console.log(
              `📧 Sent notification for significant change in "${job.keyword}"`,
            );
          } catch (emailError) {
            console.error(
              `❌ Error sending notification for "${job.keyword}":`,
              emailError,
            );
          }
        }
      }

      // Mark job as completed
      await job.markAsCompleted(result);

      // Check if there are more jobs to process
      const nextJobCount = await RankingJob.countDocuments({
        status: "pending",
      });
      const nextJobAvailable = nextJobCount > 0;

      const duration = Date.now() - startTime;
      console.log(`✅ Job completed in ${duration}ms`);

      return {
        success: true,
        jobId: job._id.toString(),
        keyword: job.keyword,
        position: result.position,
        significantChange,
        message: `Successfully processed "${job.keyword}" - Position: ${result.position}`,
        nextJobAvailable,
      };
    } catch (processingError) {
      console.error(
        `❌ Error processing keyword "${job.keyword}":`,
        processingError,
      );

      // Mark job as failed (will retry if attempts < maxAttempts)
      await job.markAsFailed(
        processingError instanceof Error
          ? processingError.message
          : "Unknown processing error",
      );

      // Check if there are more jobs to process
      const nextJobCount = await RankingJob.countDocuments({
        status: { $in: ["pending", "processing"] },
      });
      const nextJobAvailable = nextJobCount > 0;

      return {
        success: false,
        jobId: job._id.toString(),
        keyword: job.keyword,
        message: `Failed to process "${job.keyword}": ${processingError}`,
        nextJobAvailable,
      };
    }
  } catch (error) {
    console.error("❌ Error in job processing:", error);
    throw error;
  }
}

/**
 * Gets detailed status of the job queue
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  try {
    await dbConnect();

    // Get basic queue statistics
    const stats = await (RankingJob as any).getQueueStats();

    // Get additional timing information
    const [oldestPending, newestCompleted] = await Promise.all([
      RankingJob.findOne({ status: "pending" })
        .sort({ createdAt: 1 })
        .select("createdAt"),
      RankingJob.findOne({ status: "completed" })
        .sort({ completedAt: -1 })
        .select("completedAt"),
    ]);

    // Estimate time remaining (assuming 2 minutes per job)
    const avgJobTime = 2 * 60 * 1000; // 2 minutes in milliseconds
    const estimatedTimeRemaining = stats.pending * avgJobTime;

    return {
      ...stats,
      oldestPendingJob: oldestPending?.createdAt,
      newestCompletedJob: newestCompleted?.completedAt,
      estimatedTimeRemaining,
    };
  } catch (error) {
    console.error("❌ Error getting queue status:", error);
    throw error;
  }
}

/**
 * Cleans up old completed and failed jobs
 */
export async function cleanupOldJobs(daysOld: number = 7): Promise<{
  deletedCount: number;
  message: string;
}> {
  try {
    await dbConnect();

    const result = await (RankingJob as any).cleanupOldJobs(daysOld);
    console.log(`🧹 Cleaned up ${result.deletedCount} old jobs`);

    return {
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} old jobs (older than ${daysOld} days)`,
    };
  } catch (error) {
    console.error("❌ Error cleaning up old jobs:", error);
    throw error;
  }
}

/**
 * Resets stuck processing jobs back to pending
 * Useful for jobs that got stuck in "processing" state due to crashes
 */
export async function resetStuckJobs(stuckMinutes: number = 30): Promise<{
  resetCount: number;
  message: string;
}> {
  try {
    await dbConnect();

    const stuckTime = new Date(Date.now() - stuckMinutes * 60 * 1000);

    const result = await RankingJob.updateMany(
      {
        status: "processing",
        startedAt: { $lt: stuckTime },
      },
      {
        status: "pending",
        $unset: { startedAt: 1 },
      },
    );

    console.log(`🔄 Reset ${result.modifiedCount} stuck jobs`);

    return {
      resetCount: result.modifiedCount,
      message: `Reset ${result.modifiedCount} jobs that were stuck in processing state`,
    };
  } catch (error) {
    console.error("❌ Error resetting stuck jobs:", error);
    throw error;
  }
}
