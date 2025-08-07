import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IContractorAuth {
  name: string;
  email: string;
  phone?: string;
  password: string;
  skills?: string[];
  businessName?: string;
  profileImage?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  notes?: string;
  refreshTokens: string[];
  deviceTokens: string[]; // FCM device tokens for push notifications
  lastLogin?: Date;
  resetPasswordToken?: string | undefined;
  resetPasswordExpires?: Date | undefined;
  quickbooksConnected: boolean;
  quickbooksTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IContractorAuthDocument
  extends IContractorAuth,
    mongoose.Document {
  _id: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateRefreshToken(): string;
  removeRefreshToken(token: string): void;
}

export interface IContractorAuthModel
  extends mongoose.Model<IContractorAuthDocument> {
  findByEmail(email: string): Promise<IContractorAuthDocument | null>;
  findActive(): Promise<IContractorAuthDocument[]>;
  findBySkill(skill: string): Promise<IContractorAuthDocument[]>;
}

const ContractorAuthSchema = new Schema<
  IContractorAuthDocument,
  IContractorAuthModel
>(
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
      required: true,
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
    deviceTokens: {
      type: [String],
      default: [],
      index: true,
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
    next(error as Error);
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
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

ContractorAuthSchema.methods.generateRefreshToken = function (): string {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  this.refreshTokens.push(token);
  return token;
};

ContractorAuthSchema.methods.removeRefreshToken = function (
  token: string,
): void {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
};

// Static methods
ContractorAuthSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

ContractorAuthSchema.statics.findActive = function () {
  return this.find({ isActive: true, isVerified: true }).sort({ name: 1 });
};

ContractorAuthSchema.statics.findBySkill = function (skill: string) {
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

export default mongoose.model<IContractorAuthDocument, IContractorAuthModel>(
  "ContractorAuth",
  ContractorAuthSchema,
);
