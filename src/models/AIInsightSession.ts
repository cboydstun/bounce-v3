import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIInsightSessionDocument extends Document {
  reportCardSnapshot: {
    overallGrade: string;
    overallScore: number;
    totalKeywords: number;
    period: string;
    generatedAt: string;
    metrics: any;
    keywordBreakdown: any;
    trends: any;
    topPerformers: any[];
    needsAttention: any[];
    competitorAnalysis: any;
  };
  period: string;
  totalInsights: number;
  insightIds: mongoose.Types.ObjectId[];
  executiveSummary?: string;
  status: "active" | "archived";
  generatedAt: Date;
  archivedAt?: Date;
  sourceDataHash: string;
  metadata: {
    claudeModel: string;
    totalApiCalls: number;
    totalCost?: number;
    generationTimeMs: number;
    cacheHit: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIInsightSessionModel
  extends Model<IAIInsightSessionDocument> {
  findActiveSession(
    sourceDataHash: string,
  ): Promise<IAIInsightSessionDocument | null>;
  findByPeriod(period: string): Promise<IAIInsightSessionDocument[]>;
  findRecentSessions(limit?: number): Promise<IAIInsightSessionDocument[]>;
  archiveSession(sessionId: string): Promise<IAIInsightSessionDocument | null>;
  getSessionStats(): Promise<any>;
  findSimilarSession(
    reportCardSnapshot: any,
    period: string,
  ): Promise<IAIInsightSessionDocument | null>;
}

const AIInsightSessionSchema = new Schema<
  IAIInsightSessionDocument,
  IAIInsightSessionModel
>(
  {
    reportCardSnapshot: {
      overallGrade: {
        type: String,
        required: true,
      },
      overallScore: {
        type: Number,
        required: true,
      },
      totalKeywords: {
        type: Number,
        required: true,
      },
      period: {
        type: String,
        required: true,
      },
      generatedAt: {
        type: String,
        required: true,
      },
      metrics: {
        type: Schema.Types.Mixed,
        required: true,
      },
      keywordBreakdown: {
        type: Schema.Types.Mixed,
        required: true,
      },
      trends: {
        type: Schema.Types.Mixed,
        required: true,
      },
      topPerformers: [
        {
          type: Schema.Types.Mixed,
        },
      ],
      needsAttention: [
        {
          type: Schema.Types.Mixed,
        },
      ],
      competitorAnalysis: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    period: {
      type: String,
      required: true,
      index: true,
    },
    totalInsights: {
      type: Number,
      required: true,
      default: 0,
    },
    insightIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "AIInsight",
      },
    ],
    executiveSummary: {
      type: String,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      index: true,
    },
    archivedAt: {
      type: Date,
      index: true,
    },
    sourceDataHash: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      claudeModel: {
        type: String,
        required: true,
      },
      totalApiCalls: {
        type: Number,
        required: true,
        default: 0,
      },
      totalCost: Number,
      generationTimeMs: {
        type: Number,
        required: true,
      },
      cacheHit: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Static methods
AIInsightSessionSchema.statics.findActiveSession = function (
  sourceDataHash: string,
) {
  return this.findOne({
    sourceDataHash,
    status: "active",
  }).sort({ generatedAt: -1 });
};

AIInsightSessionSchema.statics.findByPeriod = function (period: string) {
  return this.find({ period }).sort({ generatedAt: -1 });
};

AIInsightSessionSchema.statics.findRecentSessions = function (
  limit: number = 10,
) {
  return this.find({ status: "active" })
    .sort({ generatedAt: -1 })
    .limit(limit)
    .populate("insightIds");
};

AIInsightSessionSchema.statics.archiveSession = function (sessionId: string) {
  return this.findByIdAndUpdate(
    sessionId,
    {
      status: "archived",
      archivedAt: new Date(),
    },
    { new: true },
  );
};

AIInsightSessionSchema.statics.getSessionStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        archivedSessions: {
          $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
        },
        totalInsights: { $sum: "$totalInsights" },
        averageInsightsPerSession: { $avg: "$totalInsights" },
        totalApiCalls: { $sum: "$metadata.totalApiCalls" },
        totalCost: { $sum: "$metadata.totalCost" },
        averageGenerationTime: { $avg: "$metadata.generationTimeMs" },
        cacheHitRate: {
          $avg: { $cond: ["$metadata.cacheHit", 1, 0] },
        },
      },
    },
  ]);
};

AIInsightSessionSchema.statics.findSimilarSession = function (
  reportCardSnapshot: any,
  period: string,
) {
  // Find sessions with similar report card scores and same period within last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return this.findOne({
    period,
    status: "active",
    generatedAt: { $gte: sevenDaysAgo },
    "reportCardSnapshot.overallScore": {
      $gte: reportCardSnapshot.overallScore - 5,
      $lte: reportCardSnapshot.overallScore + 5,
    },
    "reportCardSnapshot.totalKeywords": reportCardSnapshot.totalKeywords,
  }).sort({ generatedAt: -1 });
};

// Create compound indexes for better query performance
AIInsightSessionSchema.index({ sourceDataHash: 1, status: 1 });
AIInsightSessionSchema.index({ period: 1, generatedAt: -1 });
AIInsightSessionSchema.index({ status: 1, generatedAt: -1 });
AIInsightSessionSchema.index({
  "reportCardSnapshot.overallScore": 1,
  period: 1,
});

// TTL index to automatically archive old sessions after 180 days
AIInsightSessionSchema.index(
  { generatedAt: 1 },
  {
    expireAfterSeconds: 180 * 24 * 60 * 60, // 180 days
    partialFilterExpression: { status: "archived" },
  },
);

export default (mongoose.models.AIInsightSession as IAIInsightSessionModel) ||
  mongoose.model<IAIInsightSessionDocument, IAIInsightSessionModel>(
    "AIInsightSession",
    AIInsightSessionSchema,
  );
