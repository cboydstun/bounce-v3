import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKudosEmail {
  customerId: string;
  customerType: "order" | "contact";
  customerEmail: string;
  subject: string;
  content: string;
  sentAt: Date;
}

export interface IKudosEmailDocument extends IKudosEmail, Document {}

export interface IKudosEmailModel extends Model<IKudosEmailDocument> {
  findByCustomer(
    customerId: string,
    customerType: "order" | "contact",
  ): Promise<IKudosEmailDocument | null>;
}

const KudosEmailSchema = new Schema<IKudosEmailDocument, IKudosEmailModel>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    customerType: {
      type: String,
      enum: ["order", "contact"],
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create compound index for efficient lookups
KudosEmailSchema.index({ customerId: 1, customerType: 1 }, { unique: true });

// Static method to find kudos email by customer
KudosEmailSchema.statics.findByCustomer = function (
  customerId: string,
  customerType: "order" | "contact",
) {
  return this.findOne({ customerId, customerType });
};

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.KudosEmail as IKudosEmailModel) ||
  mongoose.model<IKudosEmailDocument, IKudosEmailModel>(
    "KudosEmail",
    KudosEmailSchema,
  );
