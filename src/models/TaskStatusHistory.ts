import mongoose, { Schema } from "mongoose";
import { TaskStatus } from "../types/task";

export interface ITaskStatusHistoryDocument extends mongoose.Document {
  taskId: string;
  orderId: string;
  previousStatus?: TaskStatus;
  newStatus: TaskStatus;
  changedBy: string; // User ID who made the change
  changedByName?: string; // User name for display
  reason?: string; // Optional reason for the change
  createdAt: Date;
}

export interface ITaskStatusHistoryModel
  extends mongoose.Model<ITaskStatusHistoryDocument> {
  /**
   * Find all status changes for a specific task
   * @param taskId The task ID to search for
   * @returns Promise resolving to an array of status history records
   */
  findByTaskId(taskId: string): Promise<ITaskStatusHistoryDocument[]>;

  /**
   * Find all status changes for a specific order
   * @param orderId The order ID to search for
   * @returns Promise resolving to an array of status history records
   */
  findByOrderId(orderId: string): Promise<ITaskStatusHistoryDocument[]>;

  /**
   * Create a status change record
   * @param data The status change data
   * @returns Promise resolving to the created record
   */
  createStatusChange(data: {
    taskId: string;
    orderId: string;
    previousStatus?: TaskStatus;
    newStatus: TaskStatus;
    changedBy: string;
    changedByName?: string;
    reason?: string;
  }): Promise<ITaskStatusHistoryDocument>;
}

const TaskStatusHistorySchema = new Schema<
  ITaskStatusHistoryDocument,
  ITaskStatusHistoryModel
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
    previousStatus: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
      required: false,
    },
    newStatus: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
      required: true,
      index: true,
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

// Static methods
TaskStatusHistorySchema.statics.findByTaskId = function (taskId: string) {
  return this.find({ taskId }).sort({ createdAt: -1 });
};

TaskStatusHistorySchema.statics.findByOrderId = function (orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

TaskStatusHistorySchema.statics.createStatusChange = function (data: {
  taskId: string;
  orderId: string;
  previousStatus?: TaskStatus;
  newStatus: TaskStatus;
  changedBy: string;
  changedByName?: string;
  reason?: string;
}) {
  return this.create(data);
};

// Compound indexes for efficient queries
TaskStatusHistorySchema.index({ taskId: 1, createdAt: -1 });
TaskStatusHistorySchema.index({ orderId: 1, createdAt: -1 });
TaskStatusHistorySchema.index({ changedBy: 1, createdAt: -1 });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.TaskStatusHistory as ITaskStatusHistoryModel) ||
  mongoose.model<ITaskStatusHistoryDocument, ITaskStatusHistoryModel>(
    "TaskStatusHistory",
    TaskStatusHistorySchema,
  );
