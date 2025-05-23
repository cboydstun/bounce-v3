import { Document, Model } from "mongoose";

/**
 * Main Contractor interface
 */
export interface Contractor {
  _id: string; // MongoDB document ID
  name: string; // Contractor/company name
  email?: string; // Contact email
  phone?: string; // Contact phone
  skills?: string[]; // Array of skills/specialties
  isActive: boolean; // Whether contractor is active
  notes?: string; // Admin notes about contractor
  createdAt: Date; // Contractor creation date
  updatedAt: Date; // Contractor last update date
}

/**
 * Form data interface for creating/updating contractors
 */
export interface ContractorFormData {
  name: string; // Contractor/company name
  email?: string; // Contact email
  phone?: string; // Contact phone
  skills?: string[]; // Array of skills/specialties
  isActive?: boolean; // Whether contractor is active (defaults to true)
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
