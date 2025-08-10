import mongoose, { Schema } from "mongoose";
import { ITaskDocument, ITaskModel, TaskStatus } from "../types/task";

// Main Task schema - aligned with API server
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
    templateId: {
      type: String,
      required: false,
      index: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow null/undefined for backward compatibility
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid ObjectId format for templateId",
      },
    },
    type: {
      type: String,
      enum: ["Delivery", "Setup", "Pickup", "Maintenance"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
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
    location: {
      type: Schema.Types.Mixed,
      required: false,
      validate: {
        validator: function (v: any) {
          // Allow null/undefined for optional field
          if (!v) return true;

          // Validate GeoJSON Point structure
          return (
            v.type === "Point" &&
            Array.isArray(v.coordinates) &&
            v.coordinates.length === 2 &&
            typeof v.coordinates[0] === "number" &&
            typeof v.coordinates[1] === "number" &&
            v.coordinates[0] >= -180 &&
            v.coordinates[0] <= 180 && // longitude
            v.coordinates[1] >= -90 &&
            v.coordinates[1] <= 90 // latitude
          );
        },
        message:
          "Location must be a valid GeoJSON Point with coordinates [longitude, latitude] in valid ranges",
      },
    },
    address: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    completionPhotos: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5; // Maximum 5 photos per task
        },
        message: "Maximum 5 completion photos allowed",
      },
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    completedAt: {
      type: Date,
    },
    paymentAmount: {
      type: Number,
      min: [0, "Payment amount must be positive"],
      max: [999999.99, "Payment amount cannot exceed $999,999.99"],
      validate: {
        validator: function (v: number) {
          // Allow null/undefined for optional field
          if (v === null || v === undefined) return true;
          // Check for valid monetary value (up to 2 decimal places)
          // Use a more robust check that accounts for floating-point precision issues
          if (!Number.isFinite(v) || v < 0) return false;
          const roundedAmount = Math.round(v * 100) / 100;
          return Math.abs(v - roundedAmount) <= 0.001;
        },
        message:
          "Payment amount must be a valid monetary value with up to 2 decimal places",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Geospatial index for location-based queries
TaskSchema.index({ location: "2dsphere" });

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

  // Set completedAt when status changes to Completed
  if (
    this.isModified("status") &&
    this.status === "Completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
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

TaskSchema.statics.findAvailableNearLocation = function (
  lat: number,
  lng: number,
  radiusInMeters: number,
  contractorSkills: string[],
  excludeContractorId?: string,
) {
  const query: any = {
    status: "Pending",
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusInMeters,
      },
    },
  };

  // Skills matching - partial match against task type
  if (
    contractorSkills &&
    Array.isArray(contractorSkills) &&
    contractorSkills.length > 0
  ) {
    // For partial matching, check if any contractor skill matches the task type
    const taskTypes = ["Delivery", "Setup", "Pickup", "Maintenance"] as const;
    const matchingTypes: string[] = [];

    for (const taskType of taskTypes) {
      for (const skill of contractorSkills) {
        if (skill && typeof skill === "string") {
          const skillLower = skill.toLowerCase();
          const taskTypeLower = taskType.toLowerCase();
          if (
            taskTypeLower.includes(skillLower) ||
            skillLower.includes(taskTypeLower)
          ) {
            matchingTypes.push(taskType);
            break;
          }
        }
      }
    }

    if (matchingTypes.length > 0) {
      query.type = { $in: matchingTypes };
    }
  }

  // Exclude tasks already assigned to this contractor
  if (excludeContractorId) {
    query.assignedContractors = { $ne: excludeContractorId };
  }

  return this.find(query).sort({
    priority: -1, // High priority first
    scheduledDateTime: 1, // Earlier tasks first
  });
};

TaskSchema.statics.findByContractor = function (
  contractorId: string,
  status?: TaskStatus,
) {
  const query: any = { assignedContractors: contractorId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ scheduledDateTime: 1 });
};

TaskSchema.statics.findByPaymentRange = function (
  minAmount: number,
  maxAmount: number,
) {
  return this.find({
    paymentAmount: {
      $gte: minAmount,
      $lte: maxAmount,
    },
  }).sort({ paymentAmount: -1, scheduledDateTime: 1 });
};

TaskSchema.statics.getPaymentStats = async function (filters = {}) {
  const { status, contractorId, startDate, endDate } = filters;

  // Build match query
  const matchQuery: any = {};

  if (status) {
    matchQuery.status = status;
  }

  if (contractorId) {
    matchQuery.assignedContractors = contractorId;
  }

  if (startDate || endDate) {
    matchQuery.scheduledDateTime = {};
    if (startDate) {
      matchQuery.scheduledDateTime.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.scheduledDateTime.$lte = new Date(endDate);
    }
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: {
            $cond: [{ $ne: ["$paymentAmount", null] }, "$paymentAmount", 0],
          },
        },
        taskCount: { $sum: 1 },
        paidTasks: {
          $sum: {
            $cond: [{ $ne: ["$paymentAmount", null] }, 1, 0],
          },
        },
        unpaidTasks: {
          $sum: {
            $cond: [{ $eq: ["$paymentAmount", null] }, 1, 0],
          },
        },
        paymentAmounts: {
          $push: {
            $cond: [
              { $ne: ["$paymentAmount", null] },
              "$paymentAmount",
              "$REMOVE",
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalAmount: 1,
        taskCount: 1,
        paidTasks: 1,
        unpaidTasks: 1,
        averageAmount: {
          $cond: [
            { $gt: ["$paidTasks", 0] },
            { $divide: ["$totalAmount", "$paidTasks"] },
            0,
          ],
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);

  if (result.length === 0) {
    return {
      totalAmount: 0,
      averageAmount: 0,
      taskCount: 0,
      paidTasks: 0,
      unpaidTasks: 0,
    };
  }

  return result[0];
};

// Compound indexes for common queries
TaskSchema.index({ orderId: 1, status: 1 });
TaskSchema.index({ templateId: 1, status: 1 });
TaskSchema.index({ scheduledDateTime: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ assignedContractors: 1, status: 1 });
TaskSchema.index({ type: 1, scheduledDateTime: 1 });
TaskSchema.index({ status: 1, priority: 1, scheduledDateTime: 1 });
TaskSchema.index({ paymentAmount: 1 });
TaskSchema.index({ paymentAmount: 1, status: 1 });

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
