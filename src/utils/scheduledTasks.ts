import { SearchKeyword, SearchRanking } from "@/models";
import { checkKeywordRanking } from "./googleSearchApi";
import dbConnect from "@/lib/db/mongoose";
import { sendRankingChangeNotification } from "./emailService";
import { RankingChangeNotification } from "@/types/searchRanking";
import { getCurrentDateCT } from "./dateUtils";

/**
 * Checks rankings for all active keywords and stores the results
 * Also sends notifications for significant ranking changes
 */
export async function checkAllKeywordRankings() {
  try {
    console.log(
      `🤖 Starting automated ranking check at ${getCurrentDateCT().toISOString()}`,
    );
    await dbConnect();

    const targetDomain = process.env.TARGET_DOMAIN;

    if (!targetDomain) {
      throw new Error("TARGET_DOMAIN environment variable is not set");
    }

    // Get all active keywords
    const keywords = await SearchKeyword.findActiveKeywords();
    console.log(`📋 Found ${keywords.length} active keywords to check`);

    if (keywords.length === 0) {
      console.log("⚠️ No active keywords to check");
      return {
        success: true,
        message: "No active keywords to check",
        checkedCount: 0,
        notificationsSent: 0,
      };
    }

    const significantChanges: RankingChangeNotification[] = [];
    let checkedCount = 0;
    let errorCount = 0;

    // Check ranking for each keyword sequentially with delays to prevent rate limiting
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      try {
        console.log(
          `🔍 Checking ranking for keyword ${i + 1}/${keywords.length}: "${keyword.keyword}"`,
        );

        // Get the ranking result using enhanced search (reduced depth for bulk operations)
        const result = await checkKeywordRanking(
          keyword.keyword,
          targetDomain,
          30, // Reduced from 50 to 30 for bulk operations to save API calls
        );

        // Ensure we have a valid URL even if the site wasn't found in search results
        let rankingUrl = result.url;
        if (!rankingUrl) {
          // Create a default URL using the target domain
          rankingUrl = targetDomain.startsWith("http")
            ? targetDomain
            : `https://${targetDomain}`;
        }

        console.log(
          `📊 Result for "${keyword.keyword}": Position ${result.position}, ${result.metadata.apiCallsUsed} API calls`,
        );

        // Save the ranking result with enhanced metadata
        const newRanking = await SearchRanking.create({
          keywordId: keyword._id,
          keyword: keyword.keyword,
          date: new Date(),
          position: result.position,
          url: rankingUrl,
          competitors: result.competitors,
          // Store enhanced metadata for future analysis
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
        checkedCount++;

        // Get previous ranking for comparison
        const previousRankings = await SearchRanking.find({
          keywordId: keyword._id,
          _id: { $ne: newRanking._id }, // Exclude the current ranking
        })
          .sort({ date: -1 })
          .limit(1);

        // If we have a previous ranking for comparison
        if (previousRankings.length > 0) {
          const previousRanking = previousRankings[0];

          // Calculate position change (positive = improved, negative = worsened)
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

        // Add delay between keywords to prevent rate limiting (except for the last keyword)
        if (i < keywords.length - 1) {
          const delaySeconds = 3; // 3 second delay between keywords
          console.log(
            `⏳ Waiting ${delaySeconds} seconds before next keyword...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, delaySeconds * 1000),
          );
        }
      } catch (error) {
        console.error(
          `❌ Error checking ranking for keyword "${keyword.keyword}":`,
          error,
        );
        errorCount++;

        // Add delay even after errors to prevent rapid retries
        if (i < keywords.length - 1) {
          const errorDelaySeconds = 5; // Longer delay after errors
          console.log(
            `⏳ Error delay: waiting ${errorDelaySeconds} seconds before next keyword...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, errorDelaySeconds * 1000),
          );
        }

        // Continue with the next keyword
        continue;
      }
    }

    // Send notification if there are significant changes
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

    const summary = {
      success: true,
      message: `Successfully checked rankings for ${checkedCount} keywords`,
      checkedCount,
      errorCount,
      notificationsSent,
      significantChanges: significantChanges.length,
    };

    console.log(`✅ Automated ranking check completed:`, summary);
    return summary;
  } catch (error) {
    console.error("❌ Error in checkAllKeywordRankings:", error);
    throw error;
  }
}

/**
 * Function to run the daily check at 8 AM Central Time
 * This should be called by a cron job or similar scheduler
 */
export async function scheduleDailyRankingCheck() {
  try {
    const now = new Date();
    const centralTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );

    // Check if it's 8 AM
    if (centralTime.getHours() === 8 && centralTime.getMinutes() < 5) {
      console.log("Running scheduled daily ranking check");
      await checkAllKeywordRankings();
    }
  } catch (error) {
    console.error("Error in scheduleDailyRankingCheck:", error);
  }
}
