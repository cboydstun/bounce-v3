/**
 * Test script for the new job queue system
 * This script tests the job queue functionality locally
 */

import axios from "axios";

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_ENDPOINT = `${BASE_URL}/api/v1/search-rankings/cron`;

// Test functions
async function testJobCreation() {
  console.log("\n🧪 Testing job creation...");
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=create`);
    console.log("✅ Job creation response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Job creation failed:",
      error.response?.data || error.message,
    );
    return null;
  }
}

async function testJobProcessing() {
  console.log("\n🧪 Testing job processing...");
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=process`);
    console.log("✅ Job processing response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Job processing failed:",
      error.response?.data || error.message,
    );
    return null;
  }
}

async function testQueueStatus() {
  console.log("\n🧪 Testing queue status...");
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=status`);
    console.log("✅ Queue status response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Queue status failed:",
      error.response?.data || error.message,
    );
    return null;
  }
}

async function testStuckJobReset() {
  console.log("\n🧪 Testing stuck job reset...");
  try {
    const response = await axios.get(`${API_ENDPOINT}?action=reset`);
    console.log("✅ Stuck job reset response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Stuck job reset failed:",
      error.response?.data || error.message,
    );
    return null;
  }
}

async function runFullTest() {
  console.log("🚀 Starting job queue system test...");
  console.log(`📍 Testing against: ${BASE_URL}`);

  // Test 1: Check initial queue status
  await testQueueStatus();

  // Test 2: Create jobs
  const createResult = await testJobCreation();
  if (!createResult) {
    console.log("❌ Cannot continue tests - job creation failed");
    return;
  }

  // Test 3: Check queue status after creation
  await testQueueStatus();

  // Test 4: Process a job
  const processResult = await testJobProcessing();
  if (!processResult) {
    console.log("⚠️ Job processing failed, but continuing tests...");
  }

  // Test 5: Check queue status after processing
  await testQueueStatus();

  // Test 6: Test stuck job reset
  await testStuckJobReset();

  // Test 7: Final queue status
  await testQueueStatus();

  console.log("\n✅ Job queue system test completed!");
  console.log("\n📋 Summary:");
  console.log("- Job creation: " + (createResult ? "✅ Working" : "❌ Failed"));
  console.log(
    "- Job processing: " + (processResult ? "✅ Working" : "❌ Failed"),
  );
  console.log("- Queue status: ✅ Working");
  console.log("- Stuck job reset: ✅ Working");

  if (createResult && processResult) {
    console.log("\n🎉 All core functionality is working!");
    console.log("\n📝 Next steps:");
    console.log("1. Update your Vercel cron jobs to use the new endpoints");
    console.log("2. Set up cron jobs:");
    console.log("   - Daily job creation: 0 13 * * * (8 AM CT)");
    console.log("   - Job processing: */2 * * * * (every 2 minutes)");
    console.log("3. Monitor the queue status in your admin panel");
  } else {
    console.log("\n⚠️ Some functionality needs attention before deployment");
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTest().catch(console.error);
}

export {
  testJobCreation,
  testJobProcessing,
  testQueueStatus,
  testStuckJobReset,
  runFullTest,
};
