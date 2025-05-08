import { SearchKeyword, SearchRanking } from "@/models";
import { checkKeywordRanking } from "./googleSearchApi";
import dbConnect from "@/lib/db/mongoose";
import { sendRankingChangeNotification } from "./emailService";
import { createDateCT } from "./dateUtils";
import { RankingChangeNotification } from "@/types/searchRanking";

/**
 * Checks rankings for all active keywords and stores the results
 * Also sends notifications for significant ranking changes
 */
export async function checkAllKeywordRankings() {
  try {
    await dbConnect();

    const targetDomain = process.env.TARGET_DOMAIN;

    if (!targetDomain) {
      throw new Error("TARGET_DOMAIN environment variable is not set");
    }

    // Get all active keywords
    const keywords = await SearchKeyword.findActiveKeywords();

    if (keywords.length === 0) {
      console.log("No active keywords to check");
      return;
    }

    const significantChanges: RankingChangeNotification[] = [];

    // Check ranking for each keyword
    for (const keyword of keywords) {
      try {
        // Get the ranking result
        const result = await checkKeywordRanking(keyword.keyword, targetDomain);

        // Ensure we have a valid URL even if the site wasn't found in search results
        let rankingUrl = result.url;
        if (!rankingUrl) {
          // Create a default URL using the target domain
          rankingUrl = targetDomain.startsWith("http")
            ? targetDomain
            : `https://${targetDomain}`;
        }

        // Save the ranking result
        await SearchRanking.create({
          keywordId: keyword._id,
          keyword: keyword.keyword,
          date: new Date(),
          position: result.position,
          url: rankingUrl,
          competitors: result.competitors,
        });

        // Get previous ranking for comparison
        const previousRankings = await SearchRanking.find({
          keywordId: keyword._id,
        })
          .sort({ date: -1 })
          .limit(2);

        // If we have at least 2 rankings (current and previous)
        if (previousRankings.length >= 2) {
          const currentRanking = previousRankings[0];
          const previousRanking = previousRankings[1];

          // Calculate position change
          const positionChange =
            previousRanking.position - currentRanking.position;

          // Check if the change is significant (5 or more positions)
          if (Math.abs(positionChange) >= 5) {
            significantChanges.push({
              keyword: keyword.keyword,
              previousPosition: previousRanking.position,
              currentPosition: currentRanking.position,
              change: positionChange,
              date: currentRanking.date,
              url: currentRanking.url,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error checking ranking for keyword "${keyword.keyword}":`,
          error,
        );
        // Continue with the next keyword
        continue;
      }
    }

    // Send notification if there are significant changes
    if (significantChanges.length > 0) {
      await sendRankingChangeNotification(significantChanges);
    }

    console.log(
      `Successfully checked rankings for ${keywords.length} keywords`,
    );
  } catch (error) {
    console.error("Error in checkAllKeywordRankings:", error);
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
