/**
 * Test script to verify search rankings data persistence
 * This script tests the database operations directly
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Simple test to verify database connection and model operations
async function testPersistence() {
  console.log("🧪 Testing Search Rankings Data Persistence\n");

  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Import models directly (avoiding TypeScript import issues)
    const SearchKeywordModule = await import("../src/models/SearchKeyword.ts");
    const SearchRankingModule = await import("../src/models/SearchRanking.ts");

    const SearchKeyword = SearchKeywordModule.default;
    const SearchRanking = SearchRankingModule.default;

    // Test 1: Check if we can find existing keywords
    console.log("📋 Test 1: Checking existing keywords...");
    const keywords = await SearchKeyword.find({});
    console.log(`   Found ${keywords.length} keywords in database`);
    keywords.forEach((keyword) => {
      console.log(
        `   - ${keyword.keyword} (${keyword.isActive ? "active" : "inactive"})`,
      );
    });

    if (keywords.length === 0) {
      console.log(
        "   ⚠️ No keywords found. You may need to add some keywords first.",
      );
    }

    // Test 2: Check if we can find existing rankings
    console.log("\n📊 Test 2: Checking existing rankings...");
    const rankings = await SearchRanking.find({}).sort({ date: -1 }).limit(10);
    console.log(`   Found ${rankings.length} rankings in database`);

    if (rankings.length > 0) {
      console.log("   📅 Recent rankings:");
      rankings.forEach((ranking, index) => {
        console.log(
          `   ${index + 1}. ${ranking.keyword}: Position ${ranking.position} (${ranking.date.toLocaleDateString()})`,
        );
      });
    } else {
      console.log(
        "   ⚠️ No rankings found. Try running a ranking check first.",
      );
    }

    // Test 3: Check database collections
    console.log("\n🗄️ Test 3: Checking database collections...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const relevantCollections = collections.filter(
      (col) => col.name.includes("keyword") || col.name.includes("ranking"),
    );

    console.log("   Relevant collections:");
    for (const collection of relevantCollections) {
      const count = await mongoose.connection.db
        .collection(collection.name)
        .countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }

    // Test 4: Test a simple write operation
    console.log("\n✍️ Test 4: Testing write operation...");
    const testKeyword = await SearchKeyword.findOne({});

    if (testKeyword) {
      const testRanking = {
        keywordId: testKeyword._id,
        keyword: testKeyword.keyword,
        date: new Date(),
        position: 999, // Test position
        url: "https://test.com",
        competitors: [],
        metadata: {
          totalResults: "1000",
          searchTime: "0.1",
          resultCount: 10,
          isValidationPassed: true,
          validationWarnings: [],
          apiCallsUsed: 1,
          searchDepth: 10,
          maxPositionSearched: 10,
        },
      };

      const savedRanking = await SearchRanking.create(testRanking);
      console.log(
        `   ✅ Successfully created test ranking with ID: ${savedRanking._id}`,
      );

      // Clean up test data
      await SearchRanking.deleteOne({ _id: savedRanking._id });
      console.log("   🗑️ Cleaned up test ranking");
    } else {
      console.log("   ⚠️ No keywords available for testing write operation");
    }
  } catch (error) {
    console.error("❌ Error during persistence test:", error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }

  console.log("\n" + "=".repeat(60));
  console.log("PERSISTENCE TEST COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:");
  console.log("1. If you see data in the database, the persistence is working");
  console.log(
    "2. If no data is found, try running a ranking check in the admin interface",
  );
  console.log("3. Check the browser console and server logs for any errors");
  console.log("4. Refresh the page to see if data persists after reload");
}

// Run the test
testPersistence().catch(console.error);
