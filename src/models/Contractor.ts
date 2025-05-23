import mongoose, { Schema } from "mongoose";
import { IContractorDocument, IContractorModel } from "../types/contractor";

// Main Contractor schema
const ContractorSchema = new Schema<IContractorDocument, IContractorModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every(
            (skill) => skill.trim().length > 0 && skill.length <= 50,
          );
        },
        message: "Each skill must be between 1 and 50 characters",
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to clean up skills array
ContractorSchema.pre("save", function (next) {
  if (this.skills && Array.isArray(this.skills)) {
    // Remove empty strings and trim whitespace
    this.skills = this.skills
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    // Remove duplicates (case-insensitive)
    const uniqueSkills = [];
    const seenSkills = new Set();

    for (const skill of this.skills) {
      const lowerSkill = skill.toLowerCase();
      if (!seenSkills.has(lowerSkill)) {
        seenSkills.add(lowerSkill);
        uniqueSkills.push(skill);
      }
    }

    this.skills = uniqueSkills;
  }
  next();
});

// Static methods
ContractorSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

ContractorSchema.statics.findBySkill = function (skill: string) {
  return this.find({
    isActive: true,
    skills: { $regex: new RegExp(skill, "i") },
  }).sort({ name: 1 });
};

ContractorSchema.statics.findByName = function (name: string) {
  return this.find({
    name: { $regex: new RegExp(name, "i") },
  }).sort({ name: 1 });
};

// Compound indexes for common queries
ContractorSchema.index({ isActive: 1, name: 1 });
ContractorSchema.index({ skills: 1, isActive: 1 });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.Contractor as IContractorModel) ||
  mongoose.model<IContractorDocument, IContractorModel>(
    "Contractor",
    ContractorSchema,
  );
