import axios from "axios";

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET environment variable is required");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${CRON_SECRET}`,
  "Content-Type": "application/json",
};

async function testBatchProcessing() {
  console.log("🧪 Testing Batch Processing System");
  console.log("=====================================\n");

  try {
    // Test 1: Create batches
    console.log("1️⃣ Testing batch creation...");
    const createResponse = await axios.get(
      `${BASE_URL}/api/v1/search-rankings/cron?action=create`,
      { headers },
    );

    console.log("✅ Batch creation response:", {
      status: createResponse.status,
      message: createResponse.data.message,
      result: createResponse.data.result,
    });
    console.log("");

    // Test 2: Get batch status
    console.log("2️⃣ Testing batch status...");
    const statusResponse = await axios.get(
      `${BASE_URL}/api/v1/search-rankings/cron?action=status`,
      { headers },
    );

    console.log("✅ Batch status response:", {
      status: statusResponse.status,
      message: statusResponse.data.message,
      result: statusResponse.data.result,
    });
    console.log("");

    // Test 3: Process a batch
    console.log("3️⃣ Testing batch processing...");
    const processResponse = await axios.get(
      `${BASE_URL}/api/v1/search-rankings/cron?action=process`,
      { headers },
    );

    console.log("✅ Batch processing response:", {
      status: processResponse.status,
      message: processResponse.data.message,
      result: processResponse.data.result,
    });
    console.log("");

    // Test 4: Get updated status
    console.log("4️⃣ Testing updated batch status...");
    const updatedStatusResponse = await axios.get(
      `${BASE_URL}/api/v1/search-rankings/cron?action=status`,
      { headers },
    );

    console.log("✅ Updated batch status response:", {
      status: updatedStatusResponse.status,
      message: updatedStatusResponse.data.message,
      result: updatedStatusResponse.data.result,
    });
    console.log("");

    console.log("🎉 All batch processing tests completed successfully!");

    // Summary
    const finalStatus = updatedStatusResponse.data.result;
    console.log("\n📊 Final Summary:");
    console.log(`   Total Batches: ${finalStatus.totalBatches}`);
    console.log(`   Pending: ${finalStatus.pendingBatches}`);
    console.log(`   Processing: ${finalStatus.processingBatches}`);
    console.log(`   Completed: ${finalStatus.completedBatches}`);
    console.log(
      `   Progress: ${finalStatus.progress}% (${finalStatus.processedKeywords}/${finalStatus.totalKeywords} keywords)`,
    );
  } catch (error) {
    console.error("❌ Test failed:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    process.exit(1);
  }
}

// Run the test
testBatchProcessing();
