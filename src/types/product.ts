import mongoose, { Document, Model } from "mongoose";

export interface Image {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  filename?: string;
  public_id?: string;
}

export interface Specification {
  name: string;
  value: string | number | boolean;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface AgeRange {
  min: number;
  max: number;
}

export interface SetupRequirements {
  space: string;
  powerSource: boolean;
  surfaceType: string[];
}

export interface MaintenanceSchedule {
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface AdditionalService {
  name: string;
  price: number;
}

export interface Price {
  base: number;
  currency: string;
}

// Base Product interface without _id (for schema definition)
export interface Product {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: Price;
  rentalDuration: "hourly" | "half-day" | "full-day" | "weekend";
  availability: "available" | "rented" | "maintenance" | "retired";
  images: Image[];
  specifications: Specification[];
  dimensions: Dimensions;
  capacity: number;
  ageRange: AgeRange;
  setupRequirements: SetupRequirements;
  features: string[];
  safetyGuidelines: string;
  maintenanceSchedule?: MaintenanceSchedule;
  weatherRestrictions: string[];
  additionalServices?: AdditionalService[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Product with ID (for API responses)
export interface ProductWithId extends Product {
  _id: string;
}

// Mongoose Document interface
export interface IProductDocument extends Product, Document {
  generateSlug(): Promise<string>;
}

// Mongoose Model interface
export interface IProductModel extends Model<IProductDocument> {
  findBySlug(slug: string): Promise<IProductDocument | null>;
  findByCategory(category: string): Promise<IProductDocument[]>;
  searchProducts(query: string): mongoose.Query<IProductDocument[], IProductDocument>;
}
