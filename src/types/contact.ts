import { Document, Model } from "mongoose";

// Define confirmation status enum
export type ConfirmationStatus =
  | "Confirmed"
  | "Pending"
  | "Called / Texted"
  | "Declined"
  | "Cancelled"
  | "Converted";

// Define the Contact interface
export interface Contact {
  _id: string;
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: Date;
  partyZipCode: string;
  message?: string;
  confirmed: ConfirmationStatus;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  basketballShoot?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  sourcePage: string;
  // Address information
  streetAddress?: string;
  city?: string;
  state?: string;
  // Party timing
  partyStartTime?: string;
  partyEndTime?: string;
  // Delivery information
  deliveryDay?: Date;
  deliveryTime?: string;
  pickupDay?: Date;
  pickupTime?: string;
  // Payment and admin information
  paymentMethod?: "cash" | "quickbooks" | "paypal" | "free";
  discountComments?: string;
  adminComments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Add Mongoose interfaces
export interface IContactDocument extends Omit<Contact, "_id">, Document {}

export interface IContactModel extends Model<IContactDocument> {
  findByEmail(email: string): Promise<IContactDocument[]>;
  findByPartyDate(date: string): Promise<IContactDocument[]>;
  findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<IContactDocument[]>;
}

// Form data interface for creating/updating contacts
export interface ContactFormData {
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: string;
  partyZipCode: string;
  message?: string;
  confirmed?: ConfirmationStatus;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  basketballShoot?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  sourcePage: string;
  // Address information
  streetAddress?: string;
  city?: string;
  state?: string;
  // Party timing
  partyStartTime?: string;
  partyEndTime?: string;
  // Delivery information
  deliveryDay?: string;
  deliveryTime?: string;
  pickupDay?: string;
  pickupTime?: string;
  // Payment and admin information
  paymentMethod?: "cash" | "quickbooks" | "paypal" | "free";
  discountComments?: string;
  adminComments?: string;
}

// Email and phone validation regex patterns
export const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
export const phoneRegex = /^(\+?[\d\s\-()]{7,16})?$/;
