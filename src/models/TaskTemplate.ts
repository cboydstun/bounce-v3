import mongoose, { Schema } from "mongoose";
import {
  ITaskTemplateDocument,
  ITaskTemplateModel,
  TaskTemplateStats,
} from "../types/taskTemplate";

// TaskTemplate schema
const TaskTemplateSchema = new Schema<
  ITaskTemplateDocument,
  ITaskTemplateModel
>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isSystemTemplate: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    defaultPriority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Medium",
    },
    titlePattern: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    descriptionPattern: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    paymentRules: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (v: any) {
          if (!v || typeof v !== "object") return false;

          // Validate required type field
          if (!v.type || !["fixed", "percentage", "formula"].includes(v.type)) {
            return false;
          }

          // Validate based on type
          if (v.type === "fixed" && (!v.baseAmount || v.baseAmount <= 0)) {
            return false;
          }

          if (
            v.type === "percentage" &&
            (!v.percentage || v.percentage <= 0 || v.percentage > 100)
          ) {
            return false;
          }

          if (v.type === "formula") {
            if (
              !v.baseAmount ||
              v.baseAmount <= 0 ||
              !v.percentage ||
              v.percentage <= 0 ||
              v.percentage > 100
            ) {
              return false;
            }
          }

          // Validate min/max amounts if present
          if (
            v.minimumAmount &&
            v.maximumAmount &&
            v.minimumAmount > v.maximumAmount
          ) {
            return false;
          }

          return true;
        },
        message: "Invalid payment rules configuration",
      },
    },
    schedulingRules: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (v: any) {
          if (!v || typeof v !== "object") return false;

          // Validate required fields
          if (
            !v.relativeTo ||
            !["eventDate", "deliveryDate", "manual"].includes(v.relativeTo)
          ) {
            return false;
          }

          if (
            typeof v.offsetDays !== "number" ||
            v.offsetDays < -365 ||
            v.offsetDays > 365
          ) {
            return false;
          }

          if (
            !v.defaultTime ||
            !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v.defaultTime)
          ) {
            return false;
          }

          if (typeof v.businessHoursOnly !== "boolean") {
            return false;
          }

          return true;
        },
        message: "Invalid scheduling rules configuration",
      },
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid ObjectId format for createdBy",
      },
      index: true,
    },
    createdByName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Validation for payment rules consistency
TaskTemplateSchema.pre("validate", function (next) {
  const paymentRules = this.paymentRules;

  if (paymentRules.type === "fixed" && !paymentRules.baseAmount) {
    return next(new Error("Fixed payment type requires a base amount"));
  }

  if (paymentRules.type === "percentage" && !paymentRules.percentage) {
    return next(
      new Error("Percentage payment type requires a percentage value"),
    );
  }

  if (paymentRules.type === "formula") {
    if (!paymentRules.baseAmount || !paymentRules.percentage) {
      return next(
        new Error(
          "Formula payment type requires both base amount and percentage",
        ),
      );
    }
  }

  // Validate min/max amounts
  if (paymentRules.minimumAmount && paymentRules.maximumAmount) {
    if (paymentRules.minimumAmount > paymentRules.maximumAmount) {
      return next(
        new Error("Minimum amount cannot be greater than maximum amount"),
      );
    }
  }

  next();
});

// Validation for template name uniqueness (among active templates)
TaskTemplateSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("name")) {
    const existingTemplate = await (
      this.constructor as ITaskTemplateModel
    ).findOne({
      name: this.name,
      isActive: true,
      deletedAt: null,
      _id: { $ne: this._id },
    });

    if (existingTemplate) {
      return next(new Error(`Template name "${this.name}" is already in use`));
    }
  }
  next();
});

// Static methods
TaskTemplateSchema.statics.findActive = function (includeSystem = true) {
  const query: any = {
    isActive: true,
    deletedAt: null,
  };

  if (!includeSystem) {
    query.isSystemTemplate = false;
  }

  return this.find(query).sort({ isSystemTemplate: -1, name: 1 });
};

TaskTemplateSchema.statics.findByCreator = function (createdBy: string) {
  return this.find({
    createdBy,
    deletedAt: null,
  }).sort({ createdAt: -1 });
};

TaskTemplateSchema.statics.getUsageStats =
  async function (): Promise<TaskTemplateStats> {
    const pipeline = [
      {
        $match: {
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalActive: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          totalSystem: {
            $sum: { $cond: [{ $eq: ["$isSystemTemplate", true] }, 1, 0] },
          },
          totalCustom: {
            $sum: { $cond: [{ $eq: ["$isSystemTemplate", false] }, 1, 0] },
          },
          totalUsage: { $sum: "$usageCount" },
        },
      },
    ];

    const statsResult = await this.aggregate(pipeline);
    const stats = statsResult[0] || {
      totalActive: 0,
      totalSystem: 0,
      totalCustom: 0,
      totalUsage: 0,
    };

    // Get most used templates
    const mostUsedTemplates = await this.find({
      deletedAt: null,
      usageCount: { $gt: 0 },
    })
      .select("_id name usageCount")
      .sort({ usageCount: -1 })
      .limit(10)
      .lean();

    return {
      ...stats,
      mostUsedTemplates: mostUsedTemplates.map((template) => ({
        templateId: template._id.toString(),
        name: template.name,
        usageCount: template.usageCount,
      })),
    };
  };

TaskTemplateSchema.statics.incrementUsage = function (templateId: string) {
  return this.findByIdAndUpdate(
    templateId,
    { $inc: { usageCount: 1 } },
    { new: true },
  );
};

TaskTemplateSchema.statics.softDelete = function (
  templateId: string,
  deletedBy: string,
) {
  return this.findByIdAndUpdate(
    templateId,
    {
      deletedAt: new Date(),
      isActive: false,
    },
    { new: true },
  );
};

TaskTemplateSchema.statics.createSystemTemplates = async function (
  createdBy: string,
) {
  const systemTemplates = [
    {
      name: "Delivery",
      description: "Standard delivery task for bounce house equipment",
      isSystemTemplate: true,
      isActive: true,
      defaultPriority: "Medium",
      titlePattern: "Delivery - {itemNames}",
      descriptionPattern:
        "Deliver {orderItems} to {fullAddress}\nCustomer: {customerName} | Order: {orderNumber}\n{specialInstructions}",
      paymentRules: {
        type: "formula",
        baseAmount: 10.0,
        percentage: 10.0,
        minimumAmount: 10.0,
        maximumAmount: 999999.99,
      },
      schedulingRules: {
        relativeTo: "deliveryDate",
        offsetDays: 0,
        defaultTime: "09:00",
        businessHoursOnly: true,
      },
      usageCount: 0,
      createdBy,
      createdByName: "System Migration",
    },
    {
      name: "Setup",
      description: "Setup task for bounce house equipment at event location",
      isSystemTemplate: true,
      isActive: true,
      defaultPriority: "Medium",
      titlePattern: "Setup - {itemNames}",
      descriptionPattern:
        "Setup {orderItems} at {fullAddress}\nCustomer: {customerName} | Order: {orderNumber}\n{specialInstructions}",
      paymentRules: {
        type: "fixed",
        baseAmount: 20.0,
        minimumAmount: 20.0,
        maximumAmount: 20.0,
      },
      schedulingRules: {
        relativeTo: "eventDate",
        offsetDays: 0,
        defaultTime: "09:00",
        businessHoursOnly: true,
      },
      usageCount: 0,
      createdBy,
      createdByName: "System Migration",
    },
    {
      name: "Pickup",
      description: "Pickup task for bounce house equipment after event",
      isSystemTemplate: true,
      isActive: true,
      defaultPriority: "Medium",
      titlePattern: "Pickup - {itemNames}",
      descriptionPattern:
        "Pickup {orderItems} from {fullAddress}\nCustomer: {customerName} | Order: {orderNumber}\n{specialInstructions}",
      paymentRules: {
        type: "formula",
        baseAmount: 10.0,
        percentage: 10.0,
        minimumAmount: 10.0,
        maximumAmount: 999999.99,
      },
      schedulingRules: {
        relativeTo: "eventDate",
        offsetDays: 1,
        defaultTime: "10:00",
        businessHoursOnly: true,
      },
      usageCount: 0,
      createdBy,
      createdByName: "System Migration",
    },
    {
      name: "Maintenance",
      description: "Maintenance task for bounce house equipment",
      isSystemTemplate: true,
      isActive: true,
      defaultPriority: "Medium",
      titlePattern: "Maintenance - {itemNames}",
      descriptionPattern:
        "Maintenance for {orderItems}\nCustomer: {customerName} | Order: {orderNumber}\n{specialInstructions}",
      paymentRules: {
        type: "fixed",
        baseAmount: 20.0,
        minimumAmount: 20.0,
        maximumAmount: 20.0,
      },
      schedulingRules: {
        relativeTo: "manual",
        offsetDays: 0,
        defaultTime: "10:00",
        businessHoursOnly: true,
      },
      usageCount: 0,
      createdBy,
      createdByName: "System Migration",
    },
  ];

  const createdTemplates = [];

  for (const templateData of systemTemplates) {
    // Check if system template already exists
    const existing = await this.findOne({
      name: templateData.name,
      isSystemTemplate: true,
      deletedAt: null,
    });

    if (!existing) {
      const template = new this(templateData);
      const savedTemplate = await template.save();
      createdTemplates.push(savedTemplate);
    } else {
      createdTemplates.push(existing);
    }
  }

  return createdTemplates;
};

// Compound indexes for common queries
TaskTemplateSchema.index({ isActive: 1, isSystemTemplate: 1 });
TaskTemplateSchema.index({ createdBy: 1, createdAt: -1 });
TaskTemplateSchema.index({ usageCount: -1 });
TaskTemplateSchema.index({ name: 1, isActive: 1, deletedAt: 1 });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.TaskTemplate as ITaskTemplateModel) ||
  mongoose.model<ITaskTemplateDocument, ITaskTemplateModel>(
    "TaskTemplate",
    TaskTemplateSchema,
  );
