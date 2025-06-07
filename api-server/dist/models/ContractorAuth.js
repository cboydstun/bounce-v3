import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
const ContractorAuthSchema = new Schema(
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
        validator: function (v) {
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
      required: true,
      minlength: 6,
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
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
          validator: function (v) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: "Invalid emergency contact email format",
        },
      },
    },
  },
  {
    timestamps: true,
  },
);
// Hash password before saving
ContractorAuthSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
// Clean up skills array
ContractorAuthSchema.pre("save", function (next) {
  if (this.skills && Array.isArray(this.skills)) {
    this.skills = this.skills
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
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
// Instance methods
ContractorAuthSchema.methods.comparePassword = async function (
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};
ContractorAuthSchema.methods.generateRefreshToken = function () {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  this.refreshTokens.push(token);
  return token;
};
ContractorAuthSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t !== token);
};
// Static methods
ContractorAuthSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};
ContractorAuthSchema.statics.findActive = function () {
  return this.find({ isActive: true, isVerified: true }).sort({ name: 1 });
};
ContractorAuthSchema.statics.findBySkill = function (skill) {
  return this.find({
    isActive: true,
    isVerified: true,
    skills: { $regex: new RegExp(skill, "i") },
  }).sort({ name: 1 });
};
// Indexes
ContractorAuthSchema.index({ isActive: 1, isVerified: 1 });
ContractorAuthSchema.index({ skills: 1, isActive: 1 });
ContractorAuthSchema.index({ refreshTokens: 1 });
export default mongoose.model("ContractorAuth", ContractorAuthSchema);
//# sourceMappingURL=ContractorAuth.js.map
