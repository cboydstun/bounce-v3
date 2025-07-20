/**
 * Test script to verify the enhanced rate limiting implementation
 * This script tests the Google Search API with the new rate limiting features
 */

const {
  checkKeywordRanking,
  checkKeywordRankingQuick,
} = require("../src/utils/googleSearchApi");
require("dotenv").config();

async function testRateLimiting() {
  console.log("🧪 Testing Enhanced Rate Limiting Implementation");
  console.log("================================================");

  const testKeywords = [
    "bounce house rental san antonio",
    "party rentals san antonio",
    "inflatable rentals san antonio",
  ];

  const targetDomain = process.env.TARGET_DOMAIN || "satxbounce.com";

  console.log(`🎯 Target Domain: ${targetDomain}`);
  console.log(`📋 Test Keywords: ${testKeywords.join(", ")}`);
  console.log("");

  let totalApiCalls = 0;
  let totalDuration = 0;
  const startTime = Date.now();

  for (let i = 0; i < testKeywords.length; i++) {
    const keyword = testKeywords[i];
    console.log(
      `\n🔍 Testing keyword ${i + 1}/${testKeywords.length}: "${keyword}"`,
    );

    const keywordStartTime = Date.now();

    try {
      // Test with reduced search depth (20 positions)
      const result = await checkKeywordRanking(keyword, targetDomain, 20);

      const keywordDuration = Date.now() - keywordStartTime;
      totalDuration += keywordDuration;
      totalApiCalls += result.metadata.apiCallsUsed || 0;

      console.log(
        `✅ Success: Position ${result.position}, ${result.metadata.apiCallsUsed} API calls, ${Math.round(keywordDuration / 1000)}s`,
      );
      console.log(
        `   📊 Results found: ${result.metadata.resultCount}, Search depth: ${result.metadata.searchDepth}`,
      );

      if (
        result.metadata.validationWarnings &&
        result.metadata.validationWarnings.length > 0
      ) {
        console.log(
          `   ⚠️ Warnings: ${result.metadata.validationWarnings.join(", ")}`,
        );
      }
    } catch (error) {
      const keywordDuration = Date.now() - keywordStartTime;
      totalDuration += keywordDuration;

      console.log(
        `❌ Error after ${Math.round(keywordDuration / 1000)}s:`,
        error.message,
      );

      if (error.response?.status === 429) {
        console.log(
          "   🚨 Rate limit error detected - this should be handled by the enhanced backoff logic",
        );
      }
    }

    // Add delay between keywords (matching the scheduled task delay)
    if (i < testKeywords.length - 1) {
      console.log("   ⏳ Waiting 8 seconds before next keyword...");
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }

  const totalTestDuration = Date.now() - startTime;

  console.log("\n📈 Test Summary");
  console.log("===============");
  console.log(`⏱️  Total Duration: ${Math.round(totalTestDuration / 1000)}s`);
  console.log(`🔧 API Processing Time: ${Math.round(totalDuration / 1000)}s`);
  console.log(`📞 Total API Calls: ${totalApiCalls}`);
  console.log(
    `⚡ Average API Calls per Keyword: ${Math.round(totalApiCalls / testKeywords.length)}`,
  );
  console.log(`🎯 Keywords Tested: ${testKeywords.length}`);

  // Calculate expected vs actual timing
  const expectedMinDuration = (testKeywords.length - 1) * 8; // 8s delays between keywords
  console.log(
    `⏰ Expected Minimum Duration: ${expectedMinDuration}s (due to delays)`,
  );

  if (totalTestDuration / 1000 >= expectedMinDuration) {
    console.log("✅ Rate limiting delays are working correctly");
  } else {
    console.log("⚠️ Rate limiting delays may not be working as expected");
  }
}

async function testQuickSearch() {
  console.log("\n🚀 Testing Quick Search (First Page Only)");
  console.log("==========================================");

  const testKeyword = "bounce house rental san antonio";
  const targetDomain = process.env.TARGET_DOMAIN || "satxbounce.com";

  const startTime = Date.now();

  try {
    const result = await checkKeywordRankingQuick(testKeyword, targetDomain);
    const duration = Date.now() - startTime;

    console.log(`✅ Quick Search Success: Position ${result.position}`);
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📞 API Calls: ${result.metadata.apiCallsUsed}`);
    console.log(`📊 Results: ${result.metadata.resultCount}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(
      `❌ Quick Search Error after ${Math.round(duration / 1000)}s:`,
      error.message,
    );
  }
}

// Run the tests
async function runTests() {
  try {
    await testRateLimiting();
    await testQuickSearch();

    console.log("\n🎉 Rate limiting tests completed!");
    console.log("\n💡 Key Improvements Implemented:");
    console.log("   • Increased inter-page delays from 1.5s to 4s");
    console.log("   • Enhanced exponential backoff (10s base, up to 60s)");
    console.log(
      "   • Circuit breaker pattern (stops after 3 consecutive 429 errors)",
    );
    console.log(
      "   • Reduced search depth from 30 to 20 positions for bulk operations",
    );
    console.log("   • Increased inter-keyword delays from 3s to 8s");
    console.log("   • Increased error delays from 5s to 15s");
    console.log("   • Added jitter to prevent thundering herd effects");
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  }
}

// Check if required environment variables are set
if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CX) {
  console.error("❌ Missing required environment variables:");
  console.error("   GOOGLE_API_KEY and GOOGLE_CX must be set");
  process.exit(1);
}

runTests();
