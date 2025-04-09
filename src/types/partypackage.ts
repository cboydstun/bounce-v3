import mongoose, { Document, Model } from "mongoose";

export interface PackageItem {
  id: string;
  name: string;
  quantity: number;
  _id?: string;
}

export interface RecommendedPartySize {
  min: number;
  max: number;
}

export interface AgeRange {
  min: number;
  max: number;
}

// Base PartyPackage interface without _id (for schema definition)
export interface PartyPackage {
  id: string;
  slug?: string;
  name: string;
  description: string;
  items: PackageItem[];
  totalRetailPrice: number;
  packagePrice: number;
  savings: number;
  savingsPercentage: number;
  recommendedPartySize: RecommendedPartySize;
  ageRange: AgeRange;
  duration: string;
  spaceRequired: string;
  powerRequired: boolean;
  seasonalRestrictions?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// PartyPackage with ID (for API responses)
export interface PartyPackageWithId extends PartyPackage {
  _id: string;
}

// Mongoose Document interface
export interface IPartyPackageDocument
  extends Omit<PartyPackage, "id">,
    Document {
  id: string; // Redefine id to avoid conflict with Document's id
  slug?: string; // Add slug field
  // Any methods we might add
}

// Mongoose Model interface
export interface IPartyPackageModel extends Model<IPartyPackageDocument> {
  findBySlug(
    slug: string,
  ): mongoose.Query<IPartyPackageDocument | null, IPartyPackageDocument>;
  searchPackages(
    query: string,
  ): mongoose.Query<IPartyPackageDocument[], IPartyPackageDocument>;
}
