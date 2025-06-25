import mongoose, { Schema, Document, Model } from "mongoose";

// Recipient tracking interface
export interface IMarketingRecipient {
  email: string;
  name: string;
  source: "contacts" | "orders" | "promoOptins";
  sourceId: string;
  status:
    | "pending"
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "failed"
    | "unsubscribed";
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failureReason?: string;
  unsubscribeToken?: string;
}

// Campaign filters interface
export interface ICampaignFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasOrders?: boolean;
  productCategories?: string[];
  consentOnly?: boolean;
  sources?: ("contacts" | "orders" | "promoOptins")[];
}

// Campaign statistics interface
export interface ICampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

// Conversion tracking interface
export interface IConversionTracking {
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

// Main marketing campaign interface
export interface IMarketingCampaign {
  name: string;
  description?: string;
  subject: string;
  content: string;
  htmlContent: string;
  template: "promotional" | "seasonal" | "product" | "custom" | "kudos";
  recipientSources: ("contacts" | "orders" | "promoOptins")[];
  recipients: IMarketingRecipient[];
  filters: ICampaignFilters;
  createdBy: mongoose.Types.ObjectId;
  sentAt?: Date;
  completedAt?: Date;
  scheduledSendTime?: Date;
  stats: ICampaignStats;
  conversionTracking: IConversionTracking;
  testMode: boolean;
  abTestVariant?: string;
  unsubscribeToken: string;
  status:
    | "draft"
    | "scheduled"
    | "sending"
    | "completed"
    | "failed"
    | "cancelled";
  aiGenerationPrompt?: string;
  notes?: string;
}

export interface IMarketingCampaignDocument
  extends IMarketingCampaign,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingCampaignModel
  extends Model<IMarketingCampaignDocument> {
  findByCreator(creatorId: string): Promise<IMarketingCampaignDocument[]>;
  findByStatus(status: string): Promise<IMarketingCampaignDocument[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<IMarketingCampaignDocument[]>;
  generateUnsubscribeToken(): string;
}

// Recipient schema
const MarketingRecipientSchema = new Schema<IMarketingRecipient>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["contacts", "orders", "promoOptins"],
      required: true,
    },
    sourceId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "failed",
        "unsubscribed",
      ],
      default: "pending",
      required: true,
    },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    failureReason: String,
    unsubscribeToken: String,
  },
  { _id: false },
);

// Campaign filters schema
const CampaignFiltersSchema = new Schema<ICampaignFilters>(
  {
    dateRange: {
      start: Date,
      end: Date,
    },
    hasOrders: Boolean,
    productCategories: [String],
    consentOnly: {
      type: Boolean,
      default: true,
    },
    sources: [
      {
        type: String,
        enum: ["contacts", "orders", "promoOptins"],
      },
    ],
  },
  { _id: false },
);

// Campaign statistics schema
const CampaignStatsSchema = new Schema<ICampaignStats>(
  {
    totalRecipients: {
      type: Number,
      default: 0,
      min: 0,
    },
    sent: {
      type: Number,
      default: 0,
      min: 0,
    },
    delivered: {
      type: Number,
      default: 0,
      min: 0,
    },
    opened: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicked: {
      type: Number,
      default: 0,
      min: 0,
    },
    failed: {
      type: Number,
      default: 0,
      min: 0,
    },
    unsubscribed: {
      type: Number,
      default: 0,
      min: 0,
    },
    openRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    clickRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deliveryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

// Conversion tracking schema
const ConversionTrackingSchema = new Schema<IConversionTracking>(
  {
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversions: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

// Main marketing campaign schema
const MarketingCampaignSchema = new Schema<
  IMarketingCampaignDocument,
  IMarketingCampaignModel
>(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      maxlength: [100, "Campaign name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    subject: {
      type: String,
      required: [true, "Email subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Email content is required"],
    },
    htmlContent: {
      type: String,
      required: [true, "HTML content is required"],
    },
    template: {
      type: String,
      enum: ["promotional", "seasonal", "product", "custom", "kudos"],
      required: true,
      default: "custom",
    },
    recipientSources: [
      {
        type: String,
        enum: ["contacts", "orders", "promoOptins"],
        required: true,
      },
    ],
    recipients: {
      type: [MarketingRecipientSchema],
      default: [],
    },
    filters: {
      type: CampaignFiltersSchema,
      required: true,
      default: () => ({ consentOnly: true }),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sentAt: Date,
    completedAt: Date,
    scheduledSendTime: Date,
    stats: {
      type: CampaignStatsSchema,
      required: true,
      default: () => ({}),
    },
    conversionTracking: {
      type: ConversionTrackingSchema,
      required: true,
      default: () => ({}),
    },
    testMode: {
      type: Boolean,
      default: false,
      required: true,
    },
    abTestVariant: String,
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "sending",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "draft",
      required: true,
      index: true,
    },
    aiGenerationPrompt: String,
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to generate unsubscribe token
MarketingCampaignSchema.pre("save", function (next) {
  if (!this.unsubscribeToken) {
    const crypto = require("crypto");
    this.unsubscribeToken = crypto.randomBytes(32).toString("hex");
  }
  next();
});

// Pre-save middleware to calculate statistics
MarketingCampaignSchema.pre("save", function (next) {
  if (this.recipients && this.recipients.length > 0) {
    const stats = this.stats;
    const recipients = this.recipients;

    stats.totalRecipients = recipients.length;
    stats.sent = recipients.filter(
      (r) =>
        r.status === "sent" ||
        r.status === "delivered" ||
        r.status === "opened" ||
        r.status === "clicked",
    ).length;
    stats.delivered = recipients.filter(
      (r) =>
        r.status === "delivered" ||
        r.status === "opened" ||
        r.status === "clicked",
    ).length;
    stats.opened = recipients.filter(
      (r) => r.status === "opened" || r.status === "clicked",
    ).length;
    stats.clicked = recipients.filter((r) => r.status === "clicked").length;
    stats.failed = recipients.filter((r) => r.status === "failed").length;
    stats.unsubscribed = recipients.filter(
      (r) => r.status === "unsubscribed",
    ).length;

    // Calculate rates
    stats.deliveryRate =
      stats.sent > 0
        ? Math.round((stats.delivered / stats.sent) * 100 * 100) / 100
        : 0;
    stats.openRate =
      stats.delivered > 0
        ? Math.round((stats.opened / stats.delivered) * 100 * 100) / 100
        : 0;
    stats.clickRate =
      stats.opened > 0
        ? Math.round((stats.clicked / stats.opened) * 100 * 100) / 100
        : 0;

    // Update conversion tracking
    this.conversionTracking.clicks = stats.clicked;
    if (this.conversionTracking.conversions > 0) {
      this.conversionTracking.conversionRate =
        Math.round(
          (this.conversionTracking.conversions / stats.clicked) * 100 * 100,
        ) / 100;
    }
  }
  next();
});

// Static methods
MarketingCampaignSchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ createdBy: creatorId }).sort({ createdAt: -1 });
};

MarketingCampaignSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

MarketingCampaignSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ createdAt: -1 });
};

MarketingCampaignSchema.statics.generateUnsubscribeToken = function (): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};

// Create indexes for performance
MarketingCampaignSchema.index({ createdBy: 1, status: 1 });
MarketingCampaignSchema.index({ sentAt: 1 });
MarketingCampaignSchema.index({ "recipients.email": 1 });
MarketingCampaignSchema.index({ "recipients.status": 1 });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.MarketingCampaign as IMarketingCampaignModel) ||
  mongoose.model<IMarketingCampaignDocument, IMarketingCampaignModel>(
    "MarketingCampaign",
    MarketingCampaignSchema,
  );
