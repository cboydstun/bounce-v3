/**
 * One-time cleanup script to clear the current job queue buildup
 * This script will remove all existing ranking jobs to fix the 51 vs 25 issue
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import the RankingJob model
const RankingJobSchema = new mongoose.Schema(
  {
    keywordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SearchKeyword",
      required: true,
    },
    keyword: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    priority: { type: Number, default: 2, min: 1, max: 3 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 3, min: 1 },
    lastError: { type: String },
    result: { type: mongoose.Schema.Types.Mixed },
    scheduledFor: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const RankingJob =
  mongoose.models.RankingJob || mongoose.model("RankingJob", RankingJobSchema);

async function cleanupJobQueue() {
  try {
    console.log("🚀 Starting job queue cleanup...");

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get current job statistics
    const stats = await RankingJob.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\n📊 Current job queue status:");
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
      statusCounts.total += stat.count;
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    console.log(`   total: ${statusCounts.total}`);

    if (statusCounts.total === 0) {
      console.log("\n✅ Job queue is already clean - no jobs to remove");
      return;
    }

    // Show some sample jobs for verification
    const sampleJobs = await RankingJob.find({})
      .limit(5)
      .select("keyword status createdAt");
    console.log("\n📋 Sample jobs in queue:");
    sampleJobs.forEach((job, index) => {
      console.log(
        `   ${index + 1}. "${job.keyword}" - ${job.status} (${job.createdAt.toISOString()})`,
      );
    });

    // Confirm cleanup
    console.log(
      `\n⚠️  About to delete ALL ${statusCounts.total} jobs from the queue`,
    );
    console.log("   This will fix the 51 vs 25 keyword discrepancy");
    console.log(
      "   The new batch processing system will handle rankings going forward",
    );

    // In a real script, you might want to add a confirmation prompt
    // For now, we'll proceed automatically since this is a bug fix

    // Delete all jobs
    const deleteResult = await RankingJob.deleteMany({});
    console.log(`\n🧹 Successfully deleted ${deleteResult.deletedCount} jobs`);

    // Verify cleanup
    const remainingJobs = await RankingJob.countDocuments({});
    console.log(`✅ Verification: ${remainingJobs} jobs remaining in queue`);

    if (remainingJobs === 0) {
      console.log("\n🎉 Job queue cleanup completed successfully!");
      console.log("\n📝 Next steps:");
      console.log("1. Deploy the updated code with batch processing");
      console.log(
        "2. The new cron will run daily at 8 AM CT and process all keywords",
      );
      console.log(
        "3. Job count will always be 0 after each run (no more buildup)",
      );
    } else {
      console.log(
        `\n⚠️  Warning: ${remainingJobs} jobs still remain - cleanup may have been incomplete`,
      );
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupJobQueue()
    .then(() => {
      console.log("\n✅ Cleanup script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Cleanup script failed:", error);
      process.exit(1);
    });
}

export { cleanupJobQueue };
