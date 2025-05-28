import mongoose from "mongoose";
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
declare const _default: IContractorAuthModel;
export default _default;
//# sourceMappingURL=ContractorAuth.d.ts.map
