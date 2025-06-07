import mongoose, { Schema } from "mongoose";
const QuickBooksTokenSchema = new Schema(
  {
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "ContractorAuth",
      required: true,
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return Boolean(v && v.length > 0);
        },
        message: "Access token is required",
      },
    },
    refreshToken: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return Boolean(v && v.length > 0);
        },
        message: "Refresh token is required",
      },
    },
    tokenType: {
      type: String,
      required: true,
      default: "Bearer",
      enum: ["Bearer"],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Token expiration must be in the future",
      },
    },
    scope: {
      type: String,
      required: true,
      default: "com.intuit.quickbooks.accounting",
    },
    realmId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^\d+$/.test(v);
        },
        message: "Invalid realm ID format",
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    lastRefreshed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);
// Instance methods
QuickBooksTokenSchema.methods.isExpired = function () {
  return new Date() >= this.expiresAt;
};
QuickBooksTokenSchema.methods.isExpiringSoon = function (
  minutesThreshold = 30,
) {
  const thresholdTime = new Date();
  thresholdTime.setMinutes(thresholdTime.getMinutes() + minutesThreshold);
  return this.expiresAt <= thresholdTime;
};
// Static methods
QuickBooksTokenSchema.statics.findByContractor = function (contractorId) {
  return this.findOne({ contractorId, isActive: true });
};
QuickBooksTokenSchema.statics.findActiveTokens = function () {
  return this.find({ isActive: true }).populate("contractorId", "name email");
};
QuickBooksTokenSchema.statics.findExpiringSoon = function (
  minutesThreshold = 30,
) {
  const thresholdTime = new Date();
  thresholdTime.setMinutes(thresholdTime.getMinutes() + minutesThreshold);
  return this.find({
    isActive: true,
    expiresAt: { $lte: thresholdTime },
  }).populate("contractorId", "name email");
};
QuickBooksTokenSchema.statics.findByRealmId = function (realmId) {
  return this.findOne({ realmId, isActive: true }).populate(
    "contractorId",
    "name email",
  );
};
// Pre-save middleware to update lastRefreshed when tokens change
QuickBooksTokenSchema.pre("save", function (next) {
  if (this.isModified("accessToken") || this.isModified("refreshToken")) {
    this.lastRefreshed = new Date();
  }
  next();
});
// Indexes
QuickBooksTokenSchema.index({ contractorId: 1, isActive: 1 });
QuickBooksTokenSchema.index({ expiresAt: 1, isActive: 1 });
QuickBooksTokenSchema.index({ realmId: 1, isActive: 1 });
QuickBooksTokenSchema.index({ lastRefreshed: -1 });
export default mongoose.model("QuickBooksToken", QuickBooksTokenSchema);
//# sourceMappingURL=QuickBooksToken.js.map
