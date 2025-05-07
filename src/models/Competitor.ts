import mongoose, { Document, Schema } from "mongoose";

export interface ICompetitorDocument extends Document {
  name: string;
  url: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create a unique compound index on name and url
CompetitorSchema.index({ name: 1, url: 1 }, { unique: true });

// Static method to find active competitors
CompetitorSchema.statics.findActiveCompetitors = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Export the model
const Competitor = mongoose.models.Competitor || mongoose.model<ICompetitorDocument>("Competitor", CompetitorSchema);

export default Competitor;
