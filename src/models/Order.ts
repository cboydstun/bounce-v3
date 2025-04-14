import mongoose, { Schema } from "mongoose";
import { 
  IOrderDocument, 
  IOrderModel, 
  OrderStatus, 
  PaymentStatus,
  PaymentMethod,
  OrderItemType,
  Currency,
  PayPalTransactionStatus
} from "../types/order";

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
        "FAILED"
      ],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  { _id: false }
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
  { _id: false }
);

// Custom validation function to ensure totalPrice = quantity * unitPrice
OrderItemSchema.pre('validate', function(next) {
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
    
    // Direct customer information fields
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please enter a valid email address"],
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
      default: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 20, // Default $20 delivery fee
    },
    processingFee: {
      type: Number,
      required: true,
      min: 0,
      default: function(this: IOrderDocument) {
        // Default 3% of subtotal
        return this.subtotal ? Math.round(this.subtotal * 0.03 * 100) / 100 : 0;
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
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Paid", "Confirmed", "Cancelled", "Refunded"],
      default: "Pending",
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Authorized", "Paid", "Failed", "Refunded", "Partially Refunded"],
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
  },
  {
    timestamps: true,
  }
);

// Custom validation to ensure either contactId or customer information is provided
OrderSchema.pre('validate', function(next) {
  if (!this.contactId && !this.customerEmail) {
    return next(new Error('Either contactId or customer email must be provided'));
  }
  next();
});

// Pre-save hook to calculate totals if not provided
OrderSchema.pre('save', function(next) {
  // Calculate subtotal from items if not provided
  if (!this.subtotal || this.subtotal === 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  // Set default delivery fee if not provided
  if (!this.deliveryFee) {
    this.deliveryFee = 20;
  }

  // Calculate processing fee if not provided (3% of subtotal)
  if (!this.processingFee) {
    this.processingFee = Math.round(this.subtotal * 0.03 * 100) / 100;
  }

  // Calculate total amount if not provided
  if (!this.totalAmount) {
    this.totalAmount = Math.round(
      (this.subtotal + this.taxAmount + this.deliveryFee + this.processingFee - this.discountAmount) * 100
    ) / 100;
  }

  // Calculate balance due if not provided
  if (!this.balanceDue) {
    this.balanceDue = Math.round((this.totalAmount - this.depositAmount) * 100) / 100;
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

// Generate a unique order number
OrderSchema.statics.generateOrderNumber = async function () {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  
  // Find all orders for this year to get the highest sequence number
  const orders = await this.find({
    orderNumber: new RegExp(`^BB-${year}-`),
  }).exec();
  
  // Start with sequence 1 or find the highest existing sequence
  let sequence = 1;
  if (orders && orders.length > 0) {
    // Extract all sequence numbers and find the highest one
    const sequences = orders.map(order => {
      const parts = order.orderNumber.split('-');
      if (parts.length === 3) {
        return parseInt(parts[2], 10);
      }
      return 0;
    });
    
    const highestSequence = Math.max(...sequences);
    sequence = highestSequence + 1;
  }
  
  // Format with padded zeros (e.g., BB-2024-0001)
  return `BB-${year}-${sequence.toString().padStart(4, '0')}`;
};

// Create text index for searching
OrderSchema.index({ orderNumber: "text" });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.Order as IOrderModel) ||
  mongoose.model<IOrderDocument, IOrderModel>("Order", OrderSchema);
