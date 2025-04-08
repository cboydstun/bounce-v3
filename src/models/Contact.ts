import mongoose, { Schema } from "mongoose";
import {
  IContactDocument,
  IContactModel,
  ConfirmationStatus,
  emailRegex,
  phoneRegex,
} from "../types/contact";

// Custom validation function for the confirmed field
const validateConfirmedStatus = function(this: IContactDocument) {
  if (this.confirmed === "Confirmed") {
    if (!this.streetAddress || !this.partyStartTime) {
      return false;
    }
  }
  return true;
};

const ContactSchema = new Schema<IContactDocument, IContactModel>(
  {
    bouncer: {
      type: String,
      required: [true, "Bouncer name is required"],
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
    partyDate: {
      type: Date,
      required: [true, "Party date is required"],
      index: true,
    },
    partyZipCode: {
      type: String,
      required: [true, "Party zip code is required"],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    confirmed: {
      type: String,
      enum: [
        "Confirmed",
        "Pending",
        "Called / Texted",
        "Declined",
        "Cancelled",
      ],
      default: "Pending",
      validate: [
        validateConfirmedStatus,
        "Contact cannot be confirmed without street address and party start time"
      ]
    },
    tablesChairs: {
      type: Boolean,
      default: false,
    },
    generator: {
      type: Boolean,
      default: false,
    },
    popcornMachine: {
      type: Boolean,
      default: false,
    },
    cottonCandyMachine: {
      type: Boolean,
      default: false,
    },
    snowConeMachine: {
      type: Boolean,
      default: false,
    },
    basketballShoot: {
      type: Boolean,
      default: false,
    },
    slushyMachine: {
      type: Boolean,
      default: false,
    },
    overnight: {
      type: Boolean,
      default: false,
    },
    sourcePage: {
      type: String,
      required: [true, "Source page is required"],
      default: "website",
    },
    // Address information
    streetAddress: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: "Texas",
    },
    // Party timing
    partyStartTime: {
      type: String,
      trim: true,
    },
    partyEndTime: {
      type: String,
      trim: true,
    },
    // Delivery information
    deliveryDay: {
      type: Date,
    },
    deliveryTime: {
      type: String,
      trim: true,
    },
    pickupDay: {
      type: Date,
    },
    pickupTime: {
      type: String,
      trim: true,
    },
    // Payment and admin information
    paymentMethod: {
      type: String,
      enum: ["cash", "quickbooks", "paypal", "free"],
      trim: true,
    },
    discountComments: {
      type: String,
      trim: true,
    },
    adminComments: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Static methods
ContactSchema.statics.findByEmail = function (email: string) {
  return this.find({ email });
};

ContactSchema.statics.findByPartyDate = function (date: string) {
  return this.find({ partyDate: new Date(date) });
};

ContactSchema.statics.findByDateRange = function (
  startDate: string,
  endDate: string,
) {
  return this.find({
    partyDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  });
};

// Create text index for searching
ContactSchema.index({ bouncer: "text", email: "text", message: "text" });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.Contact as IContactModel) ||
  mongoose.model<IContactDocument, IContactModel>("Contact", ContactSchema);
