import { SearchKeyword, SearchRanking, RankingBatch } from "@/models";
import { checkKeywordRanking } from "./googleSearchApi";
import dbConnect from "@/lib/db/mongoose";
import { sendRankingChangeNotification } from "./emailService";
import {
  RankingChangeNotification,
  DetailedBatchStatus,
  BatchProgress,
  BatchKeywordProgress,
} from "@/types/searchRanking";
import { getCurrentDateCT } from "./dateUtils";
import mongoose from "mongoose";

const BATCH_SIZE = 6; // Process 6 keywords per batch to stay well under 60s limit
const KEYWORD_DELAY = 8000; // 8 seconds between keywords
const ERROR_DELAY = 15000; // 15 seconds after errors

interface BatchProcessResult {
  success: boolean;
  batchId: string;
  processedCount: number;
  errorCount: number;
  significantChanges: number;
  isComplete: boolean;
  nextBatchScheduled: boolean;
  message: string;
}

/**
 * Creates batches for all active keywords that need to be processed
 */
export async function createRankingBatches(): Promise<{
  success: boolean;
  batchesCreated: number;
  totalKeywords: number;
  message: string;
}> {
  try {
    await dbConnect();

    // Get all active keywords
    const keywords = await SearchKeyword.findActiveKeywords();
    console.log(`📋 Found ${keywords.length} active keywords for batching`);

    if (keywords.length === 0) {
      return {
        success: true,
        batchesCreated: 0,
        totalKeywords: 0,
        message: "No active keywords to process",
      };
    }

    // Clear any existing pending/processing batches (cleanup)
    await RankingBatch.deleteMany({
      status: { $in: ["pending", "processing"] },
    });

    // Create batches
    const batches = [];
    for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      const batchKeywords = keywords.slice(i, i + BATCH_SIZE);
      const keywordIds = batchKeywords.map((k) => k._id);

      const batch = await (RankingBatch as any).createBatch(keywordIds);
      batches.push(batch);

      console.log(
        `📦 Created batch ${batch.batchId} with ${batchKeywords.length} keywords`,
      );
    }

    return {
      success: true,
      batchesCreated: batches.length,
      totalKeywords: keywords.length,
      message: `Created ${batches.length} batches for ${keywords.length} keywords`,
    };
  } catch (error) {
    console.error("❌ Error creating ranking batches:", error);
    throw error;
  }
}

/**
 * Processes the next available batch of keywords
 */
export async function processNextBatch(): Promise<BatchProcessResult> {
  const startTime = Date.now();

  try {
    await dbConnect();

    // Find the next batch to process
    const batch = await (RankingBatch as any).findActiveBatch();

    if (!batch) {
      return {
        success: true,
        batchId: "",
        processedCount: 0,
        errorCount: 0,
        significantChanges: 0,
        isComplete: true,
        nextBatchScheduled: false,
        message: "No batches to process - all ranking checks complete",
      };
    }

    console.log(
      `🔄 Processing batch ${batch.batchId} (${batch.processedCount}/${batch.totalCount} completed)`,
    );

    // Mark batch as processing
    batch.status = "processing";
    batch.startedAt = new Date();
    await batch.save();

    const targetDomain = process.env.TARGET_DOMAIN;
    if (!targetDomain) {
      throw new Error("TARGET_DOMAIN environment variable is not set");
    }

    // Get the keywords for this batch
    const keywords = await SearchKeyword.find({
      _id: { $in: batch.keywordIds },
    });

    const significantChanges: RankingChangeNotification[] = [];
    let processedCount = batch.processedCount;
    let errorCount = batch.errorCount;

    // Process each keyword in the batch
    for (let i = processedCount; i < keywords.length; i++) {
      const keyword = keywords[i];

      // Check if we're approaching the time limit (50 seconds)
      const elapsed = Date.now() - startTime;
      if (elapsed > 50000) {
        console.log(
          `⏰ Approaching time limit (${elapsed}ms), stopping batch processing`,
        );
        break;
      }

      try {
        console.log(
          `🔍 Processing keyword ${i + 1}/${keywords.length}: "${keyword.keyword}"`,
        );

        // Get the ranking result (reduced depth for batch operations)
        const result = await checkKeywordRanking(
          keyword.keyword,
          targetDomain,
          20, // Reduced search depth for batch processing
        );

        // Ensure we have a valid URL
        let rankingUrl = result.url;
        if (!rankingUrl) {
          rankingUrl = targetDomain.startsWith("http")
            ? targetDomain
            : `https://${targetDomain}`;
        }

        console.log(
          `📊 Result for "${keyword.keyword}": Position ${result.position}, ${result.metadata.apiCallsUsed} API calls`,
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

        console.log(`💾 Saved ranking with ID: ${newRanking._id}`);
        processedCount++;

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
            significantChanges.push({
              keyword: keyword.keyword,
              previousPosition: previousRanking.position,
              currentPosition: result.position,
              change: positionChange,
              date: newRanking.date,
              url: newRanking.url,
            });
            console.log(
              `🚨 Significant change detected for "${keyword.keyword}"`,
            );
          }
        }

        // Update batch progress
        batch.processedCount = processedCount;
        await batch.save();

        // Add delay between keywords (except for the last one)
        if (i < keywords.length - 1) {
          console.log(
            `⏳ Waiting ${KEYWORD_DELAY / 1000} seconds before next keyword...`,
          );
          await new Promise((resolve) => setTimeout(resolve, KEYWORD_DELAY));
        }
      } catch (error) {
        console.error(
          `❌ Error processing keyword "${keyword.keyword}":`,
          error,
        );
        errorCount++;
        batch.errorCount = errorCount;
        await batch.save();

        // Add longer delay after errors
        if (i < keywords.length - 1) {
          console.log(
            `⏳ Error delay: waiting ${ERROR_DELAY / 1000} seconds before next keyword...`,
          );
          await new Promise((resolve) => setTimeout(resolve, ERROR_DELAY));
        }
      }
    }

    // Check if batch is complete
    const isComplete = processedCount >= keywords.length;

    if (isComplete) {
      batch.status = "completed";
      batch.completedAt = new Date();
      batch.processedCount = processedCount;
      batch.errorCount = errorCount;
      await batch.save();
      console.log(`✅ Batch ${batch.batchId} completed`);
    } else {
      // Save progress but keep as processing for next execution
      batch.processedCount = processedCount;
      batch.errorCount = errorCount;
      await batch.save();
      console.log(
        `⏸️ Batch ${batch.batchId} partially processed (${processedCount}/${keywords.length})`,
      );
    }

    // Send notifications for significant changes
    let notificationsSent = 0;
    if (significantChanges.length > 0) {
      try {
        await sendRankingChangeNotification(significantChanges);
        notificationsSent = 1;
        console.log(
          `📧 Sent notification for ${significantChanges.length} significant changes`,
        );
      } catch (emailError) {
        console.error(
          "❌ Error sending ranking change notification:",
          emailError,
        );
      }
    }

    // Check if there are more batches to process
    const nextBatch = await (RankingBatch as any).findActiveBatch();
    const nextBatchScheduled = !!nextBatch;

    return {
      success: true,
      batchId: batch.batchId,
      processedCount:
        processedCount - batch.processedCount + (batch.processedCount || 0),
      errorCount,
      significantChanges: significantChanges.length,
      isComplete,
      nextBatchScheduled,
      message: isComplete
        ? `Batch completed: processed ${processedCount} keywords`
        : `Batch partially processed: ${processedCount}/${keywords.length} keywords`,
    };
  } catch (error) {
    console.error("❌ Error processing batch:", error);
    throw error;
  }
}

/**
 * Gets detailed status of all ranking batches with enhanced progress information
 */
export async function getBatchStatus(): Promise<DetailedBatchStatus> {
  try {
    await dbConnect();

    // Only count batches from current session (created in last 2 hours) or active batches
    // This prevents counting old completed batches from previous operations
    const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const batchQuery = {
      $or: [
        { status: { $in: ["pending", "processing"] } }, // Always include active batches
        {
          status: "completed",
          completedAt: { $gte: cutoffTime }, // Only recent completed batches
        },
      ],
    };

    const [
      pendingBatches,
      processingBatches,
      completedBatches,
      failedBatches,
      batches,
    ] = await Promise.all([
      RankingBatch.countDocuments({ status: "pending" }),
      RankingBatch.countDocuments({ status: "processing" }),
      RankingBatch.countDocuments({
        status: "completed",
        completedAt: { $gte: cutoffTime },
      }),
      RankingBatch.countDocuments({ status: "failed" }),
      RankingBatch.find(batchQuery).sort({ createdAt: 1 }),
    ]);

    const totalBatches = batches.length;

    const totalKeywords = batches.reduce(
      (sum, batch) => sum + batch.totalCount,
      0,
    );
    const processedKeywords = batches.reduce(
      (sum, batch) => sum + batch.processedCount,
      0,
    );
    const progress =
      totalKeywords > 0
        ? Math.round((processedKeywords / totalKeywords) * 100)
        : 0;

    // Find the current processing batch
    const currentBatchDoc = await (RankingBatch as any).findActiveBatch();
    let currentBatch: BatchProgress | undefined;
    let estimatedTimeRemaining: number | undefined;
    let processingStartTime: Date | undefined;
    let averageKeywordTime: number | undefined;

    if (currentBatchDoc) {
      // Get keywords for the current batch
      const keywords = await SearchKeyword.find({
        _id: { $in: currentBatchDoc.keywordIds },
      });

      // Create keyword progress array
      const keywordProgress: BatchKeywordProgress[] = keywords.map(
        (keyword, index) => {
          const isProcessed = index < currentBatchDoc.processedCount;
          const isCurrentlyProcessing =
            index === currentBatchDoc.processedCount &&
            currentBatchDoc.status === "processing";

          return {
            keywordId: (keyword._id as mongoose.Types.ObjectId).toString(),
            keyword: keyword.keyword,
            status: isProcessed
              ? "completed"
              : isCurrentlyProcessing
                ? "processing"
                : "pending",
          };
        },
      );

      currentBatch = {
        batchId: currentBatchDoc.batchId,
        status: currentBatchDoc.status,
        keywordProgress,
        processedCount: currentBatchDoc.processedCount,
        totalCount: currentBatchDoc.totalCount,
        errorCount: currentBatchDoc.errorCount,
        startedAt: currentBatchDoc.startedAt,
        completedAt: currentBatchDoc.completedAt,
      };

      // Calculate time estimates if batch is processing
      if (
        currentBatchDoc.status === "processing" &&
        currentBatchDoc.startedAt
      ) {
        processingStartTime = currentBatchDoc.startedAt;
        const elapsedTime = Date.now() - currentBatchDoc.startedAt.getTime();

        if (currentBatchDoc.processedCount > 0) {
          averageKeywordTime = elapsedTime / currentBatchDoc.processedCount;
          const remainingKeywords =
            currentBatchDoc.totalCount - currentBatchDoc.processedCount;
          estimatedTimeRemaining = remainingKeywords * averageKeywordTime;

          // Add estimated completion time to current batch
          currentBatch.estimatedCompletion = new Date(
            Date.now() + estimatedTimeRemaining,
          );
        }
      }
    }

    // Calculate total estimated time remaining for all batches
    if (!estimatedTimeRemaining && processingBatches > 0) {
      // If we don't have current batch timing, use average estimates
      const remainingKeywords = totalKeywords - processedKeywords;
      const avgTimePerKeyword = 12000; // 12 seconds average (8s processing + 4s overhead)
      estimatedTimeRemaining = remainingKeywords * avgTimePerKeyword;
    }

    // Calculate API calls used (estimate based on processed keywords)
    const apiCallsUsed = processedKeywords * 2; // Rough estimate: 2 API calls per keyword

    return {
      totalBatches,
      pendingBatches,
      processingBatches,
      completedBatches,
      failedBatches,
      totalKeywords,
      processedKeywords,
      progress,
      currentBatch,
      estimatedTimeRemaining,
      apiCallsUsed,
      processingStartTime,
      averageKeywordTime,
    };
  } catch (error) {
    console.error("❌ Error getting detailed batch status:", error);
    throw error;
  }
}

/**
 * Cleans up old completed batches (older than 7 days)
 */
export async function cleanupOldBatches(): Promise<{
  deletedCount: number;
  message: string;
}> {
  try {
    await dbConnect();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await RankingBatch.deleteMany({
      status: "completed",
      completedAt: { $lt: sevenDaysAgo },
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old batches`);

    return {
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} old completed batches`,
    };
  } catch (error) {
    console.error("❌ Error cleaning up old batches:", error);
    throw error;
  }
}
