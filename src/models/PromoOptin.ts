import mongoose, { Schema } from "mongoose";
import { Document, Model } from "mongoose";
import { emailRegex, phoneRegex } from "../types/contact";

// Define interfaces
export interface IPromoOptinDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  promoName: string; // Store which promotion they signed up from
  consentToContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromoOptinModel extends Model<IPromoOptinDocument> {
  findByEmail(email: string): Promise<IPromoOptinDocument[]>;
}

const PromoOptinSchema = new Schema<IPromoOptinDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [emailRegex, "Please enter a valid email address"],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [phoneRegex, "Please enter a valid phone number"],
    },
    promoName: {
      type: String,
      required: [true, "Promotion name is required"],
      trim: true,
    },
    consentToContact: {
      type: Boolean,
      required: [true, "Consent to contact is required"],
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Static methods
PromoOptinSchema.statics.findByEmail = function (email: string) {
  return this.find({ email });
};

// Create text index for searching
PromoOptinSchema.index({ name: "text", email: "text", promoName: "text" });

export default (mongoose.models.PromoOptin as IPromoOptinModel) ||
  mongoose.model<IPromoOptinDocument, IPromoOptinModel>(
    "PromoOptin",
    PromoOptinSchema,
  );
