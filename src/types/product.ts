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

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: Price;
  rentalDuration: 'hourly' | 'half-day' | 'full-day' | 'weekend';
  availability: 'available' | 'rented' | 'maintenance' | 'retired';
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
