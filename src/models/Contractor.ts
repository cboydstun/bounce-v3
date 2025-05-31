import mongoose, { Schema } from "mongoose";
import { IContractorDocument, IContractorModel } from "../types/contractor";

// Main Contractor schema (now pointing to ContractorAuth collection)
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
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    password: {
      type: String,
      minlength: 6,
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
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
    quickbooksConnected: {
      type: Boolean,
      default: false,
      index: true,
    },
    quickbooksTokens: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      phone: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (v: string) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: "Invalid emergency contact email format",
        },
      },
    },
  },
  {
    timestamps: true,
    collection: "contractorauths", // Point to the same collection as API server
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
  return this.find({ isActive: true, isVerified: true }).sort({ name: 1 });
};

ContractorSchema.statics.findBySkill = function (skill: string) {
  return this.find({
    isActive: true,
    isVerified: true,
    skills: { $regex: new RegExp(skill, "i") },
  }).sort({ name: 1 });
};

ContractorSchema.statics.findByName = function (name: string) {
  return this.find({
    name: { $regex: new RegExp(name, "i") },
  }).sort({ name: 1 });
};

// Compound indexes for common queries
ContractorSchema.index({ isActive: 1, isVerified: 1, name: 1 });
ContractorSchema.index({ skills: 1, isActive: 1, isVerified: 1 });

// Use existing model if available (for Next.js hot reloading)
export default (mongoose.models.Contractor as IContractorModel) ||
  mongoose.model<IContractorDocument, IContractorModel>(
    "Contractor",
    ContractorSchema,
  );
