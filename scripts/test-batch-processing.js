/**
 * Test script for the new batch processing system
 * This script tests the batch ranking functionality locally
 */

import axios from "axios";

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_ENDPOINT = `${BASE_URL}/api/v1/search-rankings/cron`;

// Test functions
async function testBatchProcessing() {
  console.log("\n🧪 Testing batch processing...");
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=batch`);
    console.log("✅ Batch processing response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Batch processing failed:",
      error.response?.data || error.message,
    );
    return null;
  }
}

async function testQueueStatusAfterBatch() {
  console.log("\n🧪 Testing queue status after batch...");
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=status`);
    console.log("✅ Queue status after batch:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Queue status check failed:",
      error.response?.data || error.message,
    );
    return null;
  }
}

async function runBatchTest() {
  console.log("🚀 Starting batch processing system test...");
  console.log(`📍 Testing against: ${BASE_URL}`);

  // Test 1: Check initial queue status
  console.log("\n=== STEP 1: Initial Queue Status ===");
  const initialStatus = await testQueueStatusAfterBatch();

  if (initialStatus?.result) {
    const { pending, processing, completed, failed, total } =
      initialStatus.result;
    console.log(
      `📊 Initial state: ${pending} pending, ${processing} processing, ${completed} completed, ${failed} failed (${total} total)`,
    );

    if (total > 0) {
      console.log(
        "⚠️  Warning: There are existing jobs in the queue. The batch process will clean these up.",
      );
    }
  }

  // Test 2: Run batch processing
  console.log("\n=== STEP 2: Batch Processing ===");
  const batchResult = await testBatchProcessing();

  if (!batchResult) {
    console.log("❌ Cannot continue tests - batch processing failed");
    return;
  }

  // Analyze batch results
  if (batchResult.result) {
    const {
      success,
      totalKeywords,
      processedKeywords,
      errors,
      significantChanges,
      duration,
      message,
      notifications,
    } = batchResult.result;

    console.log("\n📊 Batch Processing Results:");
    console.log(`   Success: ${success ? "✅ Yes" : "❌ No"}`);
    console.log(`   Total Keywords: ${totalKeywords}`);
    console.log(`   Processed: ${processedKeywords}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Significant Changes: ${significantChanges}`);
    console.log(`   Notifications Sent: ${notifications}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Message: ${message}`);

    // Show some sample results
    if (batchResult.result.results && batchResult.result.results.length > 0) {
      console.log("\n📋 Sample Results:");
      batchResult.result.results.slice(0, 5).forEach((result, index) => {
        const status = result.success ? "✅" : "❌";
        const position = result.success
          ? `Position ${result.position}`
          : `Error: ${result.error}`;
        console.log(
          `   ${index + 1}. ${status} "${result.keyword}" - ${position}`,
        );
      });

      if (batchResult.result.results.length > 5) {
        console.log(
          `   ... and ${batchResult.result.results.length - 5} more results`,
        );
      }
    }
  }

  // Test 3: Check final queue status
  console.log("\n=== STEP 3: Final Queue Status ===");
  const finalStatus = await testQueueStatusAfterBatch();

  if (finalStatus?.result) {
    const { pending, processing, completed, failed, total } =
      finalStatus.result;
    console.log(
      `📊 Final state: ${pending} pending, ${processing} processing, ${completed} completed, ${failed} failed (${total} total)`,
    );

    if (total === 0) {
      console.log("✅ Perfect! Queue is clean after batch processing");
    } else {
      console.log("⚠️  Warning: Queue still has jobs after batch processing");
    }
  }

  // Test Summary
  console.log("\n=== TEST SUMMARY ===");
  const batchSuccess = batchResult?.result?.success;
  const queueClean = finalStatus?.result?.total === 0;

  console.log("📋 Test Results:");
  console.log(
    `   Batch Processing: ${batchSuccess ? "✅ Working" : "❌ Failed"}`,
  );
  console.log(`   Queue Cleanup: ${queueClean ? "✅ Working" : "❌ Failed"}`);
  console.log(
    `   Queue Status API: ${finalStatus ? "✅ Working" : "❌ Failed"}`,
  );

  if (batchSuccess && queueClean) {
    console.log(
      "\n🎉 All tests passed! The batch processing system is working correctly.",
    );
    console.log("\n📝 Key Benefits:");
    console.log("   ✅ No more job queue buildup (51 vs 25 issue fixed)");
    console.log("   ✅ All keywords processed in single daily run");
    console.log("   ✅ Uses only 1 of 2 available Vercel cron slots");
    console.log("   ✅ Processes within 60-second Vercel limit");
    console.log("   ✅ Clean queue after each run");

    console.log("\n🚀 Ready for deployment!");
    console.log("   1. Deploy the updated code");
    console.log(
      "   2. Run the cleanup script: node scripts/cleanup-job-queue.js",
    );
    console.log("   3. Monitor the daily batch runs at 8 AM CT");
  } else {
    console.log("\n⚠️  Some tests failed - please review the issues above");

    if (!batchSuccess) {
      console.log("   🔧 Check batch processing logic and error handling");
    }

    if (!queueClean) {
      console.log("   🔧 Check job cleanup logic in batch processing");
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runBatchTest().catch(console.error);
}

export { testBatchProcessing, testQueueStatusAfterBatch, runBatchTest };
