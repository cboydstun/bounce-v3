import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRankingJobDocument extends Document {
  keywordId: mongoose.Types.ObjectId;
  keyword: string;
  status: "pending" | "processing" | "completed" | "failed";
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  result?: any; // Will store the RankingResult when completed
  scheduledFor?: Date;
}

export interface IRankingJobModel extends Model<IRankingJobDocument> {
  findNextJob(): Promise<IRankingJobDocument | null>;
  getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }>;
  cleanupOldJobs(daysOld?: number): Promise<{ deletedCount: number }>;
}

const RankingJobSchema = new Schema<IRankingJobDocument, IRankingJobModel>(
  {
    keywordId: {
      type: Schema.Types.ObjectId,
      ref: "SearchKeyword",
      required: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: Number,
      default: 2, // 1 = high, 2 = normal, 3 = low
      min: 1,
      max: 3,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    lastError: {
      type: String,
    },
    result: {
      type: Schema.Types.Mixed, // Stores the full RankingResult object
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Static method to find the next job to process
RankingJobSchema.statics.findNextJob = function () {
  return this.findOneAndUpdate(
    {
      status: "pending",
      scheduledFor: { $lte: new Date() },
    },
    {
      status: "processing",
      startedAt: new Date(),
    },
    {
      sort: { priority: 1, createdAt: 1 },
      new: true,
    },
  );
};

// Static method to get queue statistics
RankingJobSchema.statics.getQueueStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    result[stat._id as keyof typeof result] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Static method to cleanup old completed/failed jobs
RankingJobSchema.statics.cleanupOldJobs = function (daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    status: { $in: ["completed", "failed"] },
    completedAt: { $lt: cutoffDate },
  });
};

// Instance method to mark job as failed
RankingJobSchema.methods.markAsFailed = function (error: string) {
  this.attempts++;
  this.lastError = error;

  if (this.attempts >= this.maxAttempts) {
    this.status = "failed";
    this.completedAt = new Date();
  } else {
    this.status = "pending"; // Will be retried
    // Add exponential backoff for retries
    const backoffMinutes = Math.pow(2, this.attempts) * 5; // 5, 10, 20 minutes
    this.scheduledFor = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }

  return this.save();
};

// Instance method to mark job as completed
RankingJobSchema.methods.markAsCompleted = function (result: any) {
  this.status = "completed";
  this.completedAt = new Date();
  this.result = result;
  return this.save();
};

export default (mongoose.models.RankingJob as IRankingJobModel) ||
  mongoose.model<IRankingJobDocument, IRankingJobModel>(
    "RankingJob",
    RankingJobSchema,
  );
