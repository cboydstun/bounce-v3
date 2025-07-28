import mongoose, { Schema, Document } from "mongoose";

export interface IRankingBatch extends Document {
  batchId: string;
  keywordIds: mongoose.Types.ObjectId[];
  status: "pending" | "processing" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  processedCount: number;
  totalCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RankingBatchSchema = new Schema<IRankingBatch>(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keywordIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "SearchKeyword",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    processedCount: {
      type: Number,
      default: 0,
    },
    totalCount: {
      type: Number,
      required: true,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for finding active batches
RankingBatchSchema.index({ status: 1, createdAt: 1 });

// Static methods
RankingBatchSchema.statics.findActiveBatch = function () {
  return this.findOne({
    status: { $in: ["pending", "processing"] },
  }).sort({ createdAt: 1 });
};

RankingBatchSchema.statics.createBatch = function (
  keywordIds: mongoose.Types.ObjectId[],
) {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return this.create({
    batchId,
    keywordIds,
    totalCount: keywordIds.length,
    status: "pending",
  });
};

export const RankingBatch =
  mongoose.models.RankingBatch ||
  mongoose.model<IRankingBatch>("RankingBatch", RankingBatchSchema);
