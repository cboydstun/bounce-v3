/**
 * Test script to manually trigger the cron job endpoint
 * This helps verify that the cron job functionality is working correctly
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testCronJob() {
  console.log("🧪 Testing Cron Job Functionality\n");

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cronUrl = `${baseUrl}/api/v1/search-rankings/cron`;

    console.log(`🔗 Testing cron endpoint: ${cronUrl}`);

    // Test without authentication (should work in development)
    console.log("\n📋 Test 1: Basic cron request...");
    const response = await fetch(cronUrl, {
      method: "GET",
      headers: {
        "User-Agent": "test-script/1.0",
      },
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log(`   ✅ Cron job executed successfully`);
        console.log(`   📊 Result:`, data.result);
      } catch (parseError) {
        console.log(`   ⚠️ Response received but couldn't parse JSON`);
      }
    } else {
      console.log(`   ❌ Cron job failed with status ${response.status}`);
    }

    // Test with cron secret if available
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      console.log("\n📋 Test 2: Authenticated cron request...");
      const authResponse = await fetch(cronUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "User-Agent": "test-script/1.0",
        },
      });

      const authResponseText = await authResponse.text();
      console.log(`   Status: ${authResponse.status}`);
      console.log(`   Response: ${authResponseText}`);

      if (authResponse.ok) {
        console.log(`   ✅ Authenticated cron job executed successfully`);
      } else {
        console.log(`   ❌ Authenticated cron job failed`);
      }
    } else {
      console.log("\n📋 Test 2: Skipped (no CRON_SECRET configured)");
    }
  } catch (error) {
    console.error("❌ Error testing cron job:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("CRON JOB TEST COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:");
  console.log("1. If the test passed, the cron job is working correctly");
  console.log("2. Check the server logs for detailed execution information");
  console.log("3. Verify that rankings were saved to the database");
  console.log("4. The Vercel cron will run automatically at 8 AM Central Time");
}

// Run the test
testCronJob().catch(console.error);
