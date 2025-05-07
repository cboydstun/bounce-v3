import mongoose, { Schema } from "mongoose";

export interface ISettingsDocument extends mongoose.Document {
  maxDailyBookings: number;
  blackoutDates: Date[];
  // Other settings can be added here in the future
}

export interface ISettingsModel extends mongoose.Model<ISettingsDocument> {
  getSettings(): Promise<ISettingsDocument>;
}

const SettingsSchema = new Schema<ISettingsDocument, ISettingsModel>(
  {
    maxDailyBookings: {
      type: Number,
      required: true,
      default: 6, // Default to 6 as specified
      min: 1,
    },
    blackoutDates: {
      type: [Date],
      default: [],
      index: true, // Add index for faster queries
    },
    // Other settings can be added here
  },
  { timestamps: true },
);

// Static method to get settings (creates default if none exist)
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ maxDailyBookings: 6 });
  }
  return settings;
};

export default (mongoose.models.Settings as ISettingsModel) ||
  mongoose.model<ISettingsDocument, ISettingsModel>("Settings", SettingsSchema);
