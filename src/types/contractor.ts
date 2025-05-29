import { Document, Model } from "mongoose";

/**
 * Main Contractor interface (now aligned with ContractorAuth)
 */
export interface Contractor {
  _id: string; // MongoDB document ID
  name: string; // Contractor/company name
  email: string; // Contact email (required for alignment with API)
  phone?: string; // Contact phone
  skills?: string[]; // Array of skills/specialties
  isActive: boolean; // Whether contractor is active
  isVerified: boolean; // Whether contractor is verified (defaults to true for CRM)
  notes?: string; // Admin notes about contractor
  createdAt: Date; // Contractor creation date
  updatedAt: Date; // Contractor last update date
  
  // Auth fields (hidden from CRM UI but present in database)
  password?: string; // Hashed password (hidden from CRM)
  refreshTokens?: string[]; // JWT refresh tokens (hidden from CRM)
  lastLogin?: Date; // Last login timestamp (hidden from CRM)
  resetPasswordToken?: string; // Password reset token (hidden from CRM)
  resetPasswordExpires?: Date; // Password reset expiration (hidden from CRM)
  quickbooksConnected?: boolean; // QuickBooks integration status
  quickbooksTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }; // QuickBooks tokens (hidden from CRM)
}

/**
 * Form data interface for creating/updating contractors
 */
export interface ContractorFormData {
  name: string; // Contractor/company name
  email: string; // Contact email (required)
  phone?: string; // Contact phone
  skills?: string[]; // Array of skills/specialties
  isActive?: boolean; // Whether contractor is active (defaults to true)
  isVerified?: boolean; // Whether contractor is verified (defaults to true)
  notes?: string; // Admin notes about contractor
}

/**
 * Mongoose document interface for Contractor
 */
export interface IContractorDocument
  extends Omit<Contractor, "_id">,
    Document {}

/**
 * Mongoose model interface for Contractor with static methods
 */
export interface IContractorModel extends Model<IContractorDocument> {
  /**
   * Find all active contractors
   * @returns Promise resolving to an array of active contractors
   */
  findActive(): Promise<IContractorDocument[]>;

  /**
   * Find contractors by skill
   * @param skill The skill to search for
   * @returns Promise resolving to an array of contractors with that skill
   */
  findBySkill(skill: string): Promise<IContractorDocument[]>;

  /**
   * Find contractors by name (case-insensitive partial match)
   * @param name The name to search for
   * @returns Promise resolving to an array of matching contractors
   */
  findByName(name: string): Promise<IContractorDocument[]>;
}
