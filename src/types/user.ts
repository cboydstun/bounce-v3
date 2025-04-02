import { Document, Model } from "mongoose";

// These interfaces are no longer needed as we're using NextAuth.js
// They are kept for reference but should be removed in the future

// Mongoose interfaces
export interface IUser {
  email: string;
  password?: string; // Make password optional for session user objects
  name?: string;
  role?: string;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}
