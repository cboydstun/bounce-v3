import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIInsightDocument extends Document {
  sessionId: mongoose.Types.ObjectId;
  type: "opportunity" | "warning" | "trend" | "recommendation";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  affectedKeywords: string[];
  actionItems: string[];
  confidenceScore: number;
  category: "ranking" | "competitive" | "technical" | "content" | "performance";
  status: "new" | "in_progress" | "completed" | "dismissed";
  generatedAt: Date;
  completedAt?: Date;
  dismissedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  dismissedBy?: mongoose.Types.ObjectId;
  notes?: string;
  metadata: {
    reportCardPeriod: string;
    reportCardScore: number;
    sourceDataHash: string; // Hash of source data to detect changes
    claudeModel: string;
    apiCallCost?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIInsightModel extends Model<IAIInsightDocument> {
  findBySession(sessionId: string): Promise<IAIInsightDocument[]>;
  findByStatus(status: string): Promise<IAIInsightDocument[]>;
  findByPriority(priority: string): Promise<IAIInsightDocument[]>;
  findByCategory(category: string): Promise<IAIInsightDocument[]>;
  findActiveInsights(): Promise<IAIInsightDocument[]>;
  markCompleted(
    insightId: string,
    userId: string,
    notes?: string,
  ): Promise<IAIInsightDocument | null>;
  markDismissed(
    insightId: string,
    userId: string,
    notes?: string,
  ): Promise<IAIInsightDocument | null>;
  getInsightStats(): Promise<any>;
}

const AIInsightSchema = new Schema<IAIInsightDocument, IAIInsightModel>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AIInsightSession",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["opportunity", "warning", "trend", "recommendation"],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    affectedKeywords: [
      {
        type: String,
        maxlength: 100,
      },
    ],
    actionItems: [
      {
        type: String,
        maxlength: 500,
      },
    ],
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    category: {
      type: String,
      enum: ["ranking", "competitive", "technical", "content", "performance"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "completed", "dismissed"],
      default: "new",
      index: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      index: true,
    },
    dismissedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    dismissedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    metadata: {
      reportCardPeriod: {
        type: String,
        required: true,
      },
      reportCardScore: {
        type: Number,
        required: true,
      },
      sourceDataHash: {
        type: String,
        required: true,
      },
      claudeModel: {
        type: String,
        required: true,
      },
      apiCallCost: Number,
    },
  },
  {
    timestamps: true,
  },
);

// Add text index for search functionality
AIInsightSchema.index({ title: "text", message: "text" });

// Static methods
AIInsightSchema.statics.findBySession = function (sessionId: string) {
  return this.find({ sessionId }).sort({ priority: 1, generatedAt: -1 });
};

AIInsightSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ priority: 1, generatedAt: -1 });
};

AIInsightSchema.statics.findByPriority = function (priority: string) {
  return this.find({ priority }).sort({ generatedAt: -1 });
};

AIInsightSchema.statics.findByCategory = function (category: string) {
  return this.find({ category }).sort({ priority: 1, generatedAt: -1 });
};

AIInsightSchema.statics.findActiveInsights = function () {
  return this.find({
    status: { $in: ["new", "in_progress"] },
  }).sort({ priority: 1, generatedAt: -1 });
};

AIInsightSchema.statics.markCompleted = function (
  insightId: string,
  userId: string,
  notes?: string,
) {
  return this.findByIdAndUpdate(
    insightId,
    {
      status: "completed",
      completedAt: new Date(),
      completedBy: userId,
      notes: notes,
    },
    { new: true },
  );
};

AIInsightSchema.statics.markDismissed = function (
  insightId: string,
  userId: string,
  notes?: string,
) {
  return this.findByIdAndUpdate(
    insightId,
    {
      status: "dismissed",
      dismissedAt: new Date(),
      dismissedBy: userId,
      notes: notes,
    },
    { new: true },
  );
};

AIInsightSchema.statics.getInsightStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalInsights: { $sum: 1 },
        newInsights: {
          $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
        },
        completedInsights: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        dismissedInsights: {
          $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] },
        },
        highPriorityInsights: {
          $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
        },
        averageConfidence: { $avg: "$confidenceScore" },
      },
    },
  ]);
};

// Create compound indexes for better query performance
AIInsightSchema.index({ sessionId: 1, status: 1 });
AIInsightSchema.index({ status: 1, priority: 1, generatedAt: -1 });
AIInsightSchema.index({ category: 1, status: 1 });
AIInsightSchema.index({ "metadata.sourceDataHash": 1 });

// TTL index to automatically clean up old dismissed insights after 90 days
AIInsightSchema.index(
  { dismissedAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { dismissedAt: { $exists: true } },
  },
);

export default (mongoose.models.AIInsight as IAIInsightModel) ||
  mongoose.model<IAIInsightDocument, IAIInsightModel>(
    "AIInsight",
    AIInsightSchema,
  );
