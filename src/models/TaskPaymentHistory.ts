import mongoose, { Schema } from "mongoose";
import {
  ITaskPaymentHistoryDocument,
  ITaskPaymentHistoryModel,
} from "../types/task";

// TaskPaymentHistory schema for tracking payment amount changes
const TaskPaymentHistorySchema = new Schema<
  ITaskPaymentHistoryDocument,
  ITaskPaymentHistoryModel
>(
  {
    taskId: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid ObjectId format for taskId",
      },
    },
    orderId: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid ObjectId format for orderId",
      },
    },
    previousAmount: {
      type: Number,
      min: [0, "Previous amount must be positive"],
      max: [999999.99, "Previous amount cannot exceed $999,999.99"],
      validate: {
        validator: function (v: number) {
          // Allow null/undefined for initial set
          if (v === null || v === undefined) return true;
          // Check for valid monetary value (up to 2 decimal places)
          return (
            Number.isFinite(v) && v >= 0 && Math.round(v * 100) === v * 100
          );
        },
        message:
          "Previous amount must be a valid monetary value with up to 2 decimal places",
      },
    },
    newAmount: {
      type: Number,
      min: [0, "New amount must be positive"],
      max: [999999.99, "New amount cannot exceed $999,999.99"],
      validate: {
        validator: function (v: number) {
          // Allow null/undefined for clearing
          if (v === null || v === undefined) return true;
          // Check for valid monetary value (up to 2 decimal places)
          return (
            Number.isFinite(v) && v >= 0 && Math.round(v * 100) === v * 100
          );
        },
        message:
          "New amount must be a valid monetary value with up to 2 decimal places",
      },
    },
    changedBy: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid ObjectId format for changedBy",
      },
    },
    changedByName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  },
);

// Validation to ensure at least one amount is different
TaskPaymentHistorySchema.pre("validate", function (next) {
  // Ensure that previousAmount and newAmount are actually different
  if (this.previousAmount === this.newAmount) {
    return next(new Error("Previous amount and new amount cannot be the same"));
  }
  next();
});

// Static methods
TaskPaymentHistorySchema.statics.createPaymentChange = function (data) {
  const {
    taskId,
    orderId,
    previousAmount,
    newAmount,
    changedBy,
    changedByName,
    reason,
  } = data;

  return this.create({
    taskId,
    orderId,
    previousAmount: previousAmount || null,
    newAmount: newAmount || null,
    changedBy,
    changedByName,
    reason: reason || undefined,
  });
};

TaskPaymentHistorySchema.statics.findByTaskId = function (taskId: string) {
  return this.find({ taskId }).sort({ createdAt: -1 }); // Most recent first
};

TaskPaymentHistorySchema.statics.findByOrderId = function (orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 }); // Most recent first
};

// Compound indexes for common queries
TaskPaymentHistorySchema.index({ taskId: 1, createdAt: -1 });
TaskPaymentHistorySchema.index({ orderId: 1, createdAt: -1 });
TaskPaymentHistorySchema.index({ changedBy: 1, createdAt: -1 });
TaskPaymentHistorySchema.index({ createdAt: -1 }); // For general audit queries

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models
  .TaskPaymentHistory as ITaskPaymentHistoryModel) ||
  mongoose.model<ITaskPaymentHistoryDocument, ITaskPaymentHistoryModel>(
    "TaskPaymentHistory",
    TaskPaymentHistorySchema,
  );
