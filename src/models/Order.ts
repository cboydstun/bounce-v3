import mongoose, { Schema } from "mongoose";
import { IOrderDocument, IOrderModel, OrderStatus } from "../types/order";
import {
  DEFAULT_DELIVERY_FEE,
  DEFAULT_DISCOUNT_AMOUNT,
  DEFAULT_DEPOSIT_AMOUNT,
  DEFAULT_ORDER_STATUS,
  DEFAULT_PAYMENT_STATUS,
  DEFAULT_DELIVERY_TIME_PREFERENCE,
  DEFAULT_PICKUP_TIME_PREFERENCE,
  DEFAULT_SPECIFIC_TIME_CHARGE,
  calculateProcessingFee,
} from "../config/orderConstants";
import Counter from "./Counter";

// PayPal transaction schema
const PayPalTransactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
    },
    payerId: String,
    payerEmail: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD"],
      default: "USD",
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "SAVED",
        "APPROVED",
        "VOIDED",
        "COMPLETED",
        "PAYER_ACTION_REQUIRED",
        "FAILED",
      ],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  { _id: false },
);

// Order item schema
const OrderItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["bouncer", "extra", "add-on"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

// Custom validation function to ensure totalPrice = quantity * unitPrice
OrderItemSchema.pre("validate", function (next) {
  if (this.quantity && this.unitPrice) {
    const calculatedTotal = this.quantity * this.unitPrice;
    // Allow for small floating point differences
    if (Math.abs(calculatedTotal - this.totalPrice) > 0.01) {
      this.totalPrice = calculatedTotal;
    }
  }
  next();
});

// Main Order schema
const OrderSchema = new Schema<IOrderDocument, IOrderModel>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false, // Now optional
      index: true,
    },

    // Delivery and pickup time preferences
    deliveryTimePreference: {
      type: String,
      enum: ["flexible", "specific"],
      default: DEFAULT_DELIVERY_TIME_PREFERENCE,
      required: true,
    },
    pickupTimePreference: {
      type: String,
      enum: ["flexible", "specific"],
      default: DEFAULT_PICKUP_TIME_PREFERENCE,
      required: true,
    },
    specificTimeCharge: {
      type: Number,
      default: DEFAULT_SPECIFIC_TIME_CHARGE,
      min: 0,
    },

    // Direct customer information fields
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please enter a valid email address",
      ],
    },
    customerPhone: {
      type: String,
      trim: true,
      match: [/^(\+?[\d\s\-()]{7,16})?$/, "Please enter a valid phone number"],
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    customerCity: {
      type: String,
      trim: true,
    },
    customerState: {
      type: String,
      trim: true,
    },
    customerZipCode: {
      type: String,
      trim: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [
        (items: any[]) => items.length > 0,
        "Order must contain at least one item",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: DEFAULT_DISCOUNT_AMOUNT,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: DEFAULT_DELIVERY_FEE,
    },
    processingFee: {
      type: Number,
      required: true,
      min: 0,
      default: function (this: IOrderDocument) {
        return this.subtotal ? calculateProcessingFee(this.subtotal) : 0;
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
      default: DEFAULT_DEPOSIT_AMOUNT,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Paid",
        "Confirmed",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Authorized",
        "Paid",
        "Failed",
        "Refunded",
        "Partially Refunded",
      ],
      default: "Pending",
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "cash", "quickbooks", "free"],
      required: true,
    },
    paypalTransactions: {
      type: [PayPalTransactionSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    tasks: {
      type: [String],
      default: [],
    },

    // Agreement tracking fields
    agreementStatus: {
      type: String,
      enum: ["not_sent", "pending", "viewed", "signed"],
      default: "not_sent",
      required: true,
      index: true,
    },
    agreementSentAt: {
      type: Date,
    },
    agreementViewedAt: {
      type: Date,
    },
    agreementSignedAt: {
      type: Date,
    },
    docusealSubmissionId: {
      type: String,
      trim: true,
    },
    signedDocumentUrl: {
      type: String,
      trim: true,
    },
    deliveryBlocked: {
      type: Boolean,
      default: true,
      required: true,
    },
    agreementOverrideReason: {
      type: String,
      trim: true,
    },
    agreementOverrideBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Event and delivery dates
    deliveryDate: {
      type: Date,
      index: true,
    },
    eventDate: {
      type: Date,
      index: true,
    },

    // Kudos email tracking fields
    kudosEmailSent: {
      type: Boolean,
      default: false,
      required: true,
    },
    kudosEmailSentAt: {
      type: Date,
    },
    kudosEmailContent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Custom validation to ensure either contactId or customer information is provided
OrderSchema.pre("validate", function (next) {
  if (!this.contactId && !this.customerEmail) {
    return next(
      new Error("Either contactId or customer email must be provided"),
    );
  }
  next();
});

// Pre-save hook to calculate totals if not provided
OrderSchema.pre("save", function (next) {
  // Calculate subtotal from items if not provided
  if (!this.subtotal || this.subtotal === 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  // Set default delivery fee if not provided
  if (!this.deliveryFee && this.deliveryFee !== 0) {
    this.deliveryFee = DEFAULT_DELIVERY_FEE;
  }

  // Calculate processing fee if not provided
  if (!this.processingFee) {
    this.processingFee = calculateProcessingFee(this.subtotal);
  }

  // Calculate total amount if not provided
  if (!this.totalAmount) {
    this.totalAmount =
      Math.round(
        (this.subtotal +
          this.taxAmount +
          this.deliveryFee +
          this.processingFee +
          this.specificTimeCharge -
          this.discountAmount) *
          100,
      ) / 100;
  }

  // Calculate balance due if not provided or not explicitly set to 0
  // Use isNaN to check if it's undefined or null, but allow explicit 0 values
  if (
    isNaN(this.balanceDue) ||
    this.balanceDue === undefined ||
    this.balanceDue === null
  ) {
    this.balanceDue =
      Math.round((this.totalAmount - this.depositAmount) * 100) / 100;
  }

  next();
});

// Static methods
OrderSchema.statics.findByOrderNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber });
};

OrderSchema.statics.findByContactId = function (contactId: string) {
  return this.find({ contactId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByStatus = function (status: OrderStatus) {
  return this.find({ status });
};

OrderSchema.statics.findByDateRange = function (
  startDate: string,
  endDate: string,
) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  });
};

// Generate a unique order number using atomic counter
OrderSchema.statics.generateOrderNumber = async function () {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const yearPrefix = `BB-${year}-`;

  // Find the highest existing order number for this year
  const highestOrder = await this.findOne({
    orderNumber: new RegExp(`^${yearPrefix}\\d{4}$`),
  }).sort({ orderNumber: -1 });

  // Get the current counter value
  const counterName = `orderNumber-${year}`;
  let counter = await Counter.findOne({ _id: counterName });

  // If we have existing orders with higher numbers than our counter, update the counter
  if (highestOrder) {
    const numericPart = parseInt(highestOrder.orderNumber.split("-")[2]);

    // If no counter exists or the highest order number is greater than our counter
    if (!counter || numericPart >= counter.seq) {
      // Set the counter to the highest number + 1
      counter = await Counter.findOneAndUpdate(
        { _id: counterName },
        { seq: numericPart + 1 },
        { upsert: true, new: true },
      );
    }
  }

  // Now get the next sequence (which will be properly initialized)
  const sequence = await Counter.getNextSequence(counterName);

  // Format with padded zeros (e.g., BB-2024-0001)
  return `${yearPrefix}${sequence.toString().padStart(4, "0")}`;
};

// Create text index for searching
OrderSchema.index({ orderNumber: "text" });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.Order as IOrderModel) ||
  mongoose.model<IOrderDocument, IOrderModel>("Order", OrderSchema);
