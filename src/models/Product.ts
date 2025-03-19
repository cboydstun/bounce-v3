import mongoose, { Schema } from "mongoose";
import { IProductDocument, IProductModel } from "../types/product";
import slugify from "slugify";

// Create schemas for nested types
const ImageSchema = new Schema({
  url: { type: String, required: true },
  alt: String,
  isPrimary: { type: Boolean, default: false },
  filename: String,
  public_id: String,
});

const SpecificationSchema = new Schema({
  name: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
});

const DimensionsSchema = new Schema({
  length: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  unit: { type: String, default: "feet" },
});

const AgeRangeSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
});

const SetupRequirementsSchema = new Schema({
  space: { type: String, required: true },
  powerSource: { type: Boolean, default: true },
  surfaceType: [{ type: String }],
});

const MaintenanceScheduleSchema = new Schema({
  lastMaintenance: Date,
  nextMaintenance: Date,
});

const AdditionalServiceSchema = new Schema({
  name: { type: String },
  price: { type: Number },
});

const PriceSchema = new Schema({
  base: { type: Number, required: true },
  currency: { type: String, default: "USD" },
});

// Main Product Schema
const ProductSchema = new Schema<IProductDocument, IProductModel>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    price: {
      type: PriceSchema,
      required: [true, "Product price is required"],
    },
    rentalDuration: {
      type: String,
      enum: ["hourly", "half-day", "full-day", "weekend"],
      default: "full-day",
    },
    availability: {
      type: String,
      enum: ["available", "rented", "maintenance", "retired"],
      default: "available",
    },
    images: [ImageSchema],
    specifications: [SpecificationSchema],
    dimensions: {
      type: DimensionsSchema,
      required: [true, "Product dimensions are required"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
    },
    ageRange: {
      type: AgeRangeSchema,
      required: [true, "Age range is required"],
    },
    setupRequirements: {
      type: SetupRequirementsSchema,
      required: [true, "Setup requirements are required"],
    },
    features: [{ type: String }],
    safetyGuidelines: {
      type: String,
      required: [true, "Safety guidelines are required"],
    },
    maintenanceSchedule: MaintenanceScheduleSchema,
    weatherRestrictions: [{ type: String }],
    additionalServices: [AdditionalServiceSchema],
  },
  { timestamps: true },
);

// Pre-save hook to generate slug
ProductSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  try {
    this.slug = await this.generateSlug();
    next();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    next(error);
  }
});

// Method to generate unique slug
ProductSchema.methods.generateSlug = async function (): Promise<string> {
  const baseSlug = slugify(this.name, { lower: true });

  // Check if slug exists
  const Product = mongoose.model<IProductDocument, IProductModel>("Product");
  const slugExists = await Product.findOne({
    slug: baseSlug,
    _id: { $ne: this._id },
  });

  if (!slugExists) return baseSlug;

  // If slug exists, append a random string
  return `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
};

// Static methods
ProductSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug });
};

ProductSchema.statics.findByCategory = function (category: string) {
  return this.find({ category });
};

ProductSchema.statics.searchProducts = function (query: string) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } });
};

// Indexes for better query performance
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ availability: 1 });
ProductSchema.index({ "price.base": 1 });
ProductSchema.index({ "dimensions.length": 1, "dimensions.width": 1 });
ProductSchema.index({ capacity: 1 });

// Create text index for searching
ProductSchema.index({
  name: "text",
  description: "text",
  features: "text",
  category: "text",
});

// Check if the model already exists to prevent overwriting during hot reloads in development
const Product =
  (mongoose.models.Product as IProductModel) ||
  mongoose.model<IProductDocument, IProductModel>("Product", ProductSchema);

export default Product;
