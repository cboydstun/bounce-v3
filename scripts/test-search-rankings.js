/**
 * Test script for Search Rankings feature
 * This script tests the enhanced Google Search API with validation
 */

import dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Since we can't directly import TypeScript modules, we'll test via API endpoints
const API_BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function testSearchRankings() {
  console.log("🧪 Testing Search Rankings Feature with Enhanced Validation\n");

  const targetDomain = process.env.TARGET_DOMAIN || "satxbounce.com";
  const testKeywords = [
    "san antonio bounce house rentals",
    "party rental services",
    "inflatable rentals",
  ];

  console.log(`🎯 Target Domain: ${targetDomain}`);
  console.log(`🔍 Test Keywords: ${testKeywords.join(", ")}`);
  console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

  // Check if server is running
  try {
    console.log("🔌 Checking if development server is running...");
    await axios.get(`${API_BASE_URL}/api/health`);
    console.log("✅ Development server is running\n");
  } catch (error) {
    console.log(
      "⚠️ Development server health check failed, but continuing with test...\n",
    );
  }

  // Test CSE diagnostic via API
  console.log("=".repeat(60));
  console.log("CSE CONFIGURATION DIAGNOSTIC (via API)");
  console.log("=".repeat(60));

  try {
    console.log("\n🔬 Running CSE diagnostic via API...");

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/search-rankings/validate`,
      {
        testKeywords: testKeywords,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      },
    );

    const { diagnostic } = response.data;

    console.log(`\n📋 Diagnostic Results:`);
    console.log(
      `   Health Status: ${diagnostic.isHealthy ? "✅ HEALTHY" : "❌ ISSUES DETECTED"}`,
    );
    console.log(`   Issues Found: ${diagnostic.issues.length}`);
    console.log(`   Recommendations: ${diagnostic.recommendations.length}`);

    if (diagnostic.issues.length > 0) {
      console.log(`\n⚠️ Issues Detected:`);
      diagnostic.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (diagnostic.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      diagnostic.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log(`\n📊 Test Results Summary:`);
    diagnostic.testResults.forEach((result) => {
      const status =
        result.position > 0 && result.position <= 2
          ? "🔴"
          : result.position > 0
            ? "🟢"
            : "⚪";
      console.log(
        `   ${status} "${result.keyword}": ${result.position > 0 ? `#${result.position}` : "Not found"} (${result.warnings.length} warnings)`,
      );
    });
  } catch (error) {
    console.error("❌ Error running CSE diagnostic via API:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(
        `   Message: ${error.response.data?.message || "Unknown error"}`,
      );
      if (error.response.status === 401) {
        console.error(
          "   🔐 Authentication required - this test needs to be run with proper auth",
        );
      }
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "   🔌 Connection refused - make sure the development server is running",
      );
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }

  // Test configuration guidance endpoint
  console.log("\n" + "=".repeat(60));
  console.log("CONFIGURATION GUIDANCE TEST");
  console.log("=".repeat(60));

  try {
    console.log("\n📖 Fetching configuration guidance...");

    const response = await axios.get(
      `${API_BASE_URL}/api/v1/search-rankings/validate`,
      {
        timeout: 10000,
      },
    );

    const { guidance } = response.data;

    console.log(`\n📋 Configuration Guidance:`);
    console.log(`   Checklist Items: ${guidance.checklistItems.length}`);
    console.log(`   Common Issues: ${guidance.commonIssues.length}`);
    console.log(
      `   Configuration Steps: ${guidance.cseConfigurationSteps.length}`,
    );

    console.log(`\n✅ High Priority Checklist Items:`);
    guidance.checklistItems
      .filter((item) => item.priority === "high")
      .forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title}`);
        console.log(`      ${item.description}`);
      });
  } catch (error) {
    console.error("❌ Error fetching configuration guidance:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(
        `   Message: ${error.response.data?.message || "Unknown error"}`,
      );
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:");
  console.log("1. Review the validation warnings above");
  console.log("2. If issues are detected, check your Google CSE configuration");
  console.log('3. Ensure "Search the entire web" is enabled in CSE settings');
  console.log("4. Remove any site restrictions in CSE configuration");
  console.log(
    "5. Test the admin interface at: " +
      API_BASE_URL +
      "/admin/search-rankings",
  );
  console.log(
    "6. Run manual ranking checks to see the enhanced logging in action",
  );
}

// Run the test
testSearchRankings().catch(console.error);
