import { Document, Model } from "mongoose";
import { IContactDocument } from "./contact";

/**
 * Defines the possible order statuses
 */
export type OrderStatus =
  | "Pending" // Initial state when order is created
  | "Processing" // Order is being processed
  | "Paid" // Payment has been received
  | "Confirmed" // Order has been confirmed
  | "Cancelled" // Order has been cancelled
  | "Refunded"; // Order has been refunded

/**
 * Defines the possible payment statuses
 */
export type PaymentStatus =
  | "Pending" // Payment not yet initiated
  | "Authorized" // Payment authorized but not captured
  | "Paid" // Payment completed
  | "Failed" // Payment attempt failed
  | "Refunded" // Payment fully refunded
  | "Partially Refunded"; // Payment partially refunded

/**
 * Defines the possible payment methods
 */
export type PaymentMethod = "paypal" | "cash" | "quickbooks" | "free";

/**
 * Defines the possible order item types
 */
export type OrderItemType = "bouncer" | "extra" | "add-on";

/**
 * Only USD is supported
 */
export type Currency = "USD";

/**
 * Defines the PayPal transaction status types
 */
export type PayPalTransactionStatus =
  | "CREATED" // Transaction created but not completed
  | "SAVED" // Transaction saved for later completion
  | "APPROVED" // Transaction approved but not captured
  | "VOIDED" // Transaction voided
  | "COMPLETED" // Transaction completed successfully
  | "PAYER_ACTION_REQUIRED" // Requires additional payer action
  | "FAILED"; // Transaction failed

/**
 * Interface for PayPal transaction details
 */
export interface PayPalTransactionDetails {
  transactionId: string; // PayPal transaction ID
  payerId?: string; // PayPal payer ID
  payerEmail?: string; // Payer's email address
  amount: number; // Transaction amount
  currency: Currency; // Transaction currency
  status: PayPalTransactionStatus; // Transaction status
  createdAt: Date; // Transaction creation date
  updatedAt?: Date; // Transaction last update date
}

/**
 * Interface for order items
 */
export interface OrderItem {
  type: OrderItemType; // Type of item
  name: string; // Item name
  description?: string; // Item description
  quantity: number; // Quantity ordered
  unitPrice: number; // Price per unit
  totalPrice: number; // Total price (quantity * unitPrice)
}

/**
 * Main Order interface
 */
export interface Order {
  _id: string; // MongoDB document ID
  contactId?: string | IContactDocument; // Optional reference to the Contact

  // Direct customer information (used when no contactId is provided)
  customerName?: string; // Customer's name
  customerEmail?: string; // Customer's email
  customerPhone?: string; // Customer's phone
  customerAddress?: string; // Customer's address
  customerCity?: string; // Customer's city
  customerState?: string; // Customer's state
  customerZipCode?: string; // Customer's zip code

  orderNumber: string; // Unique order identifier (e.g., BB-2024-1234)
  items: OrderItem[]; // Array of ordered items
  subtotal: number; // Sum of all item prices before tax/discounts
  taxAmount: number; // Tax amount
  discountAmount: number; // Discount amount
  deliveryFee: number; // Delivery fee (default $20)
  processingFee: number; // Credit card processing fee (3% of subtotal)
  totalAmount: number; // Final amount (subtotal + tax + deliveryFee + processingFee - discount)
  depositAmount: number; // Initial deposit amount
  balanceDue: number; // Remaining balance (totalAmount - depositAmount)
  status: OrderStatus; // Current order status
  paymentStatus: PaymentStatus; // Current payment status
  paymentMethod: PaymentMethod; // Method of payment
  paypalTransactions?: PayPalTransactionDetails[]; // PayPal transaction details if applicable
  notes?: string; // Additional order notes
  tasks?: string[]; // List of tasks associated with the order
  createdAt: Date; // Order creation date
  updatedAt: Date; // Order last update date
}

/**
 * Form data interface for creating orders
 */
export interface OrderFormData {
  contactId?: string; // Optional: ID of the associated contact

  // Direct customer information (used when no contactId is provided)
  customerName?: string; // Customer's name
  customerEmail?: string; // Customer's email
  customerPhone?: string; // Customer's phone
  customerAddress?: string; // Customer's address
  customerCity?: string; // Customer's city
  customerState?: string; // Customer's state
  customerZipCode?: string; // Customer's zip code

  items: OrderItem[]; // Array of ordered items
  subtotal?: number; // Optional: can be calculated from items
  taxAmount?: number; // Optional: can be calculated from subtotal
  discountAmount?: number; // Optional: discount amount
  deliveryFee?: number; // Optional: defaults to 20
  processingFee?: number; // Optional: can be calculated (3% of subtotal)
  totalAmount?: number; // Optional: can be calculated
  depositAmount?: number; // Optional: initial deposit
  balanceDue?: number; // Optional: can be calculated
  status?: OrderStatus; // Optional: defaults to "Pending"
  paymentStatus?: PaymentStatus; // Optional: defaults to "Pending"
  paymentMethod: PaymentMethod; // Required: method of payment
  notes?: string; // Optional: additional notes
  tasks?: string[]; // Optional: list of tasks
}

/**
 * Mongoose document interface for Order
 */
export interface IOrderDocument extends Omit<Order, "_id">, Document {}

/**
 * Mongoose model interface for Order with static methods
 */
export interface IOrderModel extends Model<IOrderDocument> {
  /**
   * Find an order by its order number
   * @param orderNumber The order number to search for
   * @returns Promise resolving to the order or null if not found
   */
  findByOrderNumber(orderNumber: string): Promise<IOrderDocument | null>;

  /**
   * Find all orders associated with a contact
   * @param contactId The contact ID to search for
   * @returns Promise resolving to an array of orders
   */
  findByContactId(contactId: string): Promise<IOrderDocument[]>;

  /**
   * Find all orders with a specific status
   * @param status The order status to search for
   * @returns Promise resolving to an array of orders
   */
  findByStatus(status: OrderStatus): Promise<IOrderDocument[]>;

  /**
   * Find all orders created within a date range
   * @param startDate Start date in ISO format (YYYY-MM-DD)
   * @param endDate End date in ISO format (YYYY-MM-DD)
   * @returns Promise resolving to an array of orders
   */
  findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<IOrderDocument[]>;

  /**
   * Generate a unique order number
   * @returns Promise resolving to a new unique order number
   */
  generateOrderNumber(): Promise<string>;
}

// Validation patterns
export const orderNumberRegex = /^BB-\d{4}-\d{4}$/;
export const currencyRegex = /^[A-Z]{3}$/;
export const paypalTransactionIdRegex = /^[A-Z0-9]{1,20}$/;
