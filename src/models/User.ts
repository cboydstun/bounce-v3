import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import { IUserDocument, IUserModel } from "../types/user";

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default in queries
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  try {
    // Check if password is modified
    if (!this.isModified("password")) return next();

    // Generate salt
    const salt = await bcryptjs.genSalt(10);

    // Hash the password
    const hashedPassword = await bcryptjs.hash(this.password, salt);

    // Replace plain text password with hashed password
    this.password = hashedPassword;
    next();
  } catch (error: unknown) {
    return next(error instanceof Error ? error : new Error(String(error)));
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcryptjs.compare(candidatePassword, this.password);
};

// Static method to find by email
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

// Check if the model already exists to prevent overwriting during hot reloads in development
const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>("User", UserSchema);

export default User;
