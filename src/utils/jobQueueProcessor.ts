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

interface BatchRankingResult {
  success: boolean;
  totalKeywords: number;
  processedKeywords: number;
  errors: number;
  significantChanges: number;
  duration: number;
  message: string;
  results: Array<{
    keyword: string;
    position: number;
    success: boolean;
    error?: string;
  }>;
  notifications: number;
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

/**
 * NEW: Batch process all keywords directly without job queue
 * This function processes all active keywords in a single run
 * Designed for Vercel Hobby tier with daily cron limitations
 */
export async function processBatchRankings(): Promise<BatchRankingResult> {
  const startTime = Date.now();
  const results: Array<{
    keyword: string;
    position: number;
    success: boolean;
    error?: string;
  }> = [];
  const errors: Array<{ keyword: string; error: string }> = [];
  let significantChanges = 0;
  let notificationsSent = 0;

  try {
    await dbConnect();

    console.log(
      `🚀 Starting batch ranking processing at ${new Date().toISOString()}`,
    );

    // Step 1: Clean up ALL old jobs (complete cleanup)
    const cleanupResult = await RankingJob.deleteMany({});
    console.log(
      `🧹 Cleaned up ${cleanupResult.deletedCount} old jobs (all statuses)`,
    );

    // Step 2: Get all active keywords
    const keywords = await SearchKeyword.findActiveKeywords();
    console.log(
      `📋 Found ${keywords.length} active keywords for batch processing`,
    );

    if (keywords.length === 0) {
      return {
        success: true,
        totalKeywords: 0,
        processedKeywords: 0,
        errors: 0,
        significantChanges: 0,
        duration: Date.now() - startTime,
        message: "No active keywords to process",
        results: [],
        notifications: 0,
      };
    }

    const targetDomain = process.env.TARGET_DOMAIN;
    if (!targetDomain) {
      throw new Error("TARGET_DOMAIN environment variable is not set");
    }

    // Step 3: Process each keyword directly
    const significantChangeNotifications: RankingChangeNotification[] = [];

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];

      // Time check: ensure we don't exceed 50 seconds (leave 10 seconds buffer)
      const elapsed = Date.now() - startTime;
      if (elapsed > 50000) {
        console.log(
          `⏰ Approaching time limit (${elapsed}ms), stopping at keyword ${i + 1}/${keywords.length}`,
        );
        break;
      }

      try {
        console.log(
          `🔄 Processing keyword "${keyword.keyword}" (${i + 1}/${keywords.length})`,
        );

        // Process the keyword ranking with reduced search depth for faster processing
        const result = await checkKeywordRanking(
          keyword.keyword,
          targetDomain,
          30, // Reduced search depth for batch processing performance
        );

        // Ensure we have a valid URL
        let rankingUrl = result.url;
        if (!rankingUrl) {
          rankingUrl = targetDomain.startsWith("http")
            ? targetDomain
            : `https://${targetDomain}`;
        }

        console.log(
          `📊 Result for "${keyword.keyword}": Position ${result.position}`,
        );

        // Save the ranking result
        const newRanking = await SearchRanking.create({
          keywordId: keyword._id,
          keyword: keyword.keyword,
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

        // Check for significant changes
        const previousRankings = await SearchRanking.find({
          keywordId: keyword._id,
          _id: { $ne: newRanking._id },
        })
          .sort({ date: -1 })
          .limit(1);

        if (previousRankings.length > 0) {
          const previousRanking = previousRankings[0];
          const positionChange = previousRanking.position - result.position;

          console.log(
            `📈 Position change for "${keyword.keyword}": ${previousRanking.position} → ${result.position} (${positionChange > 0 ? "+" : ""}${positionChange})`,
          );

          // Check if the change is significant (3 or more positions)
          if (Math.abs(positionChange) >= 3) {
            significantChanges++;
            console.log(
              `🚨 Significant change detected for "${keyword.keyword}"`,
            );

            // Collect notification data (send in batch later)
            significantChangeNotifications.push({
              keyword: keyword.keyword,
              previousPosition: previousRanking.position,
              currentPosition: result.position,
              change: positionChange,
              date: newRanking.date,
              url: newRanking.url,
            });
          }
        }

        // Add to successful results
        results.push({
          keyword: keyword.keyword,
          position: result.position,
          success: true,
        });

        console.log(`✅ Successfully processed "${keyword.keyword}"`);
      } catch (keywordError) {
        console.error(
          `❌ Error processing keyword "${keyword.keyword}":`,
          keywordError,
        );

        const errorMessage =
          keywordError instanceof Error
            ? keywordError.message
            : "Unknown processing error";

        errors.push({
          keyword: keyword.keyword,
          error: errorMessage,
        });

        results.push({
          keyword: keyword.keyword,
          position: -1,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Step 4: Send batch notifications for significant changes
    if (significantChangeNotifications.length > 0) {
      try {
        await sendRankingChangeNotification(significantChangeNotifications);
        notificationsSent = significantChangeNotifications.length;
        console.log(
          `📧 Sent batch notification for ${significantChangeNotifications.length} significant changes`,
        );
      } catch (emailError) {
        console.error(`❌ Error sending batch notifications:`, emailError);
      }
    }

    const duration = Date.now() - startTime;
    const successfulProcessed = results.filter((r) => r.success).length;

    console.log(`✅ Batch processing completed in ${duration}ms`);
    console.log(
      `📊 Results: ${successfulProcessed}/${keywords.length} processed, ${errors.length} errors, ${significantChanges} significant changes`,
    );

    return {
      success: true,
      totalKeywords: keywords.length,
      processedKeywords: successfulProcessed,
      errors: errors.length,
      significantChanges,
      duration,
      message: `Successfully processed ${successfulProcessed}/${keywords.length} keywords in ${Math.round(duration / 1000)}s`,
      results,
      notifications: notificationsSent,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Error in batch ranking processing:", error);

    return {
      success: false,
      totalKeywords: 0,
      processedKeywords: results.filter((r) => r.success).length,
      errors: errors.length + 1,
      significantChanges,
      duration,
      message: `Batch processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      results,
      notifications: notificationsSent,
    };
  }
}
