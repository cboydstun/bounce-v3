import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  contractorId: mongoose.Types.ObjectId;
  type: "task" | "system" | "personal";
  priority: "critical" | "high" | "normal" | "low";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  delivered: boolean;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: "Contractor",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["task", "system", "personal"],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ["critical", "high", "normal", "low"],
    required: true,
    default: "normal",
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  data: {
    type: Schema.Types.Mixed,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  delivered: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  readAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 },
  },
});

// Compound indexes for efficient queries
NotificationSchema.index({ contractorId: 1, createdAt: -1 });
NotificationSchema.index({ contractorId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ contractorId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ priority: 1, delivered: 1, createdAt: 1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
