import { Document, Model } from "mongoose";

// Define the Contact interface
export interface Contact {
    _id: string;
    bouncer: string;
    email: string;
    phone?: string;
    partyDate: Date;
    partyZipCode: string;
    message?: string;
    confirmed: boolean;
    tablesChairs?: boolean;
    generator?: boolean;
    popcornMachine?: boolean;
    cottonCandyMachine?: boolean;
    snowConeMachine?: boolean;
    margaritaMachine?: boolean;
    slushyMachine?: boolean;
    overnight?: boolean;
    sourcePage: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Add Mongoose interfaces
export interface IContactDocument extends Omit<Contact, "_id">, Document { }

export interface IContactModel extends Model<IContactDocument> {
    findByEmail(email: string): Promise<IContactDocument[]>;
    findByPartyDate(date: string): Promise<IContactDocument[]>;
    findByDateRange(
        startDate: string,
        endDate: string
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
    confirmed?: boolean;
    tablesChairs?: boolean;
    generator?: boolean;
    popcornMachine?: boolean;
    cottonCandyMachine?: boolean;
    snowConeMachine?: boolean;
    margaritaMachine?: boolean;
    slushyMachine?: boolean;
    overnight?: boolean;
    sourcePage: string;
}

// Email and phone validation regex patterns
export const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
export const phoneRegex = /^(\+?[\d\s\-()]{7,16})?$/;
