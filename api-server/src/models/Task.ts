import mongoose, { Schema } from "mongoose";
import { ITaskDocument, ITaskModel, TaskStatus } from "../types/task";

// Main Task schema
const TaskSchema = new Schema<ITaskDocument, ITaskModel>(
  {
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
    type: {
      type: String,
      enum: ["Delivery", "Setup", "Pickup", "Maintenance"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    scheduledDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
      required: true,
      default: "Pending",
      index: true,
    },
    assignedContractors: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every((id) => mongoose.Types.ObjectId.isValid(id));
        },
        message: "All contractor IDs must be valid ObjectIds",
      },
      index: true,
    },
    assignedTo: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },
);

// Validation to ensure scheduledDateTime is not in the past (except for updates)
TaskSchema.pre("validate", function (next) {
  // Only validate for new documents or when scheduledDateTime is being modified
  if (this.isNew || this.isModified("scheduledDateTime")) {
    const now = new Date();
    const scheduled = new Date(this.scheduledDateTime);

    // Allow some buffer for immediate scheduling (5 minutes)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (scheduled.getTime() < now.getTime() - bufferTime) {
      return next(new Error("Scheduled date/time cannot be in the past"));
    }
  }
  next();
});

// Validation for status transitions
TaskSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("status")) {
    const currentStatus = this.status as TaskStatus;
    const previousStatus = (this as any)._original?.status as TaskStatus;

    // Define valid status transitions
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      Pending: ["Assigned", "Cancelled"],
      Assigned: ["In Progress", "Pending", "Cancelled"],
      "In Progress": ["Completed", "Assigned", "Cancelled"],
      Completed: [], // Completed tasks cannot be changed
      Cancelled: ["Pending"], // Cancelled tasks can be reactivated
    };

    if (previousStatus && validTransitions[previousStatus]) {
      if (!validTransitions[previousStatus].includes(currentStatus)) {
        return next(
          new Error(
            `Invalid status transition from ${previousStatus} to ${currentStatus}`,
          ),
        );
      }
    }
  }
  next();
});

// Static methods
TaskSchema.statics.findByOrderId = function (orderId: string) {
  return this.find({ orderId }).sort({ scheduledDateTime: 1, priority: -1 });
};

TaskSchema.statics.findByStatus = function (status: TaskStatus) {
  return this.find({ status }).sort({ scheduledDateTime: 1 });
};

TaskSchema.statics.findByDateRange = function (
  startDate: string,
  endDate: string,
) {
  return this.find({
    scheduledDateTime: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ scheduledDateTime: 1 });
};

TaskSchema.statics.findByAssignee = function (assignedTo: string) {
  return this.find({ assignedTo }).sort({ scheduledDateTime: 1 });
};

// Compound indexes for common queries
TaskSchema.index({ orderId: 1, status: 1 });
TaskSchema.index({ scheduledDateTime: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ assignedContractors: 1, status: 1 });
TaskSchema.index({ type: 1, scheduledDateTime: 1 });

// Store original document for status transition validation
TaskSchema.pre("save", function (next) {
  if (!this.isNew) {
    (this as any)._original = this.toObject();
  }
  next();
});

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.Task as ITaskModel) ||
  mongoose.model<ITaskDocument, ITaskModel>("Task", TaskSchema);
