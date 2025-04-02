import { Document, Model } from "mongoose";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean; // Optional property for "Remember me" functionality
}

export interface LoginResponse {
  token: string;
}

export interface LoginError {
  error: string;
}

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
