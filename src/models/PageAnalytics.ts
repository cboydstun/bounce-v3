import mongoose, { Schema } from "mongoose";

// Page analytics aggregation model for better performance
export interface IPageAnalytics {
  _id?: string;
  url: string;
  date: Date; // Daily aggregation
  visits: number;
  uniqueVisitors: number;
  bounceRate: number;
  averageTimeOnPage: number;
  deviceBreakdown: {
    Mobile: number;
    Desktop: number;
    Tablet: number;
  };
  referrerBreakdown: {
    [source: string]: number;
  };
  conversionEvents: number;
  exitRate: number;
  pageCategory: string; // location, event, product, general
  pageSubcategory?: string; // specific location or event type
}

const PageAnalyticsSchema = new Schema<IPageAnalytics>(
  {
    url: { type: String, required: true },
    date: { type: Date, required: true },
    visits: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    averageTimeOnPage: { type: Number, default: 0 },
    deviceBreakdown: {
      Mobile: { type: Number, default: 0 },
      Desktop: { type: Number, default: 0 },
      Tablet: { type: Number, default: 0 },
    },
    referrerBreakdown: {
      type: Schema.Types.Mixed,
      default: {},
    },
    conversionEvents: { type: Number, default: 0 },
    exitRate: { type: Number, default: 0 },
    pageCategory: {
      type: String,
      enum: ["location", "event", "product", "general", "admin"],
      required: true,
    },
    pageSubcategory: String,
  },
  { timestamps: true },
);

// Compound index for efficient queries
PageAnalyticsSchema.index({ url: 1, date: 1 }, { unique: true });
PageAnalyticsSchema.index({ date: -1 });
PageAnalyticsSchema.index({ pageCategory: 1, date: -1 });
PageAnalyticsSchema.index({ visits: -1 });

export default mongoose.models.PageAnalytics ||
  mongoose.model<IPageAnalytics>("PageAnalytics", PageAnalyticsSchema);
