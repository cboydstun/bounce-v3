import mongoose, { Schema } from "mongoose";
import {
  IPartyPackageDocument,
  IPartyPackageModel,
} from "../types/partypackage";

// Create schema for nested types
const PackageItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const RecommendedPartySizeSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
});

const AgeRangeSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
});

// Main PartyPackage Schema
const PartyPackageSchema = new Schema<
  IPartyPackageDocument,
  IPartyPackageModel
>(
  {
    id: {
      type: String,
      required: [true, "Package ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Package description is required"],
    },
    items: {
      type: [PackageItemSchema],
      required: [true, "Package items are required"],
    },
    totalRetailPrice: {
      type: Number,
      required: [true, "Total retail price is required"],
    },
    packagePrice: {
      type: Number,
      required: [true, "Package price is required"],
    },
    savings: {
      type: Number,
      required: [true, "Savings amount is required"],
    },
    savingsPercentage: {
      type: Number,
      required: [true, "Savings percentage is required"],
    },
    recommendedPartySize: {
      type: RecommendedPartySizeSchema,
      required: [true, "Recommended party size is required"],
    },
    ageRange: {
      type: AgeRangeSchema,
      required: [true, "Age range is required"],
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      enum: ["hourly", "half-day", "full-day", "weekend"],
    },
    spaceRequired: {
      type: String,
      required: [true, "Space requirements are required"],
    },
    powerRequired: {
      type: Boolean,
      default: false,
    },
    seasonalRestrictions: {
      type: String,
    },
  },
  { timestamps: true },
);

// Pre-save hook to generate slug from id if not provided
PartyPackageSchema.pre("save", async function (next) {
  if (!this.isModified("id") && !this.isModified("name")) return next();

  try {
    // If slug is not set, use id as the slug
    if (!this.slug) {
      this.slug = this.id;
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Static methods
PartyPackageSchema.statics.findBySlug = function (slug: string) {
  // Try to find by slug first, then by id as fallback
  return this.findOne({ $or: [{ slug }, { id: slug }] });
};

PartyPackageSchema.statics.searchPackages = function (query: string) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } });
};

// Indexes for better query performance
PartyPackageSchema.index({ name: 1 });
PartyPackageSchema.index({ packagePrice: 1 });
PartyPackageSchema.index({ savingsPercentage: 1 });

// Create text index for searching
PartyPackageSchema.index({
  name: "text",
  description: "text",
});

// Check if the model already exists to prevent overwriting during hot reloads in development
const PartyPackage =
  (mongoose.models.PartyPackage as IPartyPackageModel) ||
  mongoose.model<IPartyPackageDocument, IPartyPackageModel>(
    "PartyPackage",
    PartyPackageSchema,
  );

export default PartyPackage;
