import { Document, Model } from "mongoose";

// Mongoose interfaces
export interface IUser {
  email: string;
  password?: string; // Make password optional for session user objects
  name?: string;
  role: "admin" | "customer" | "user"; // Role is required
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}
