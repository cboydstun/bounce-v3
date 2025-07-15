/**
 * Centralized constants for order calculations and defaults
 */

// Tax and fee rates
export const TAX_RATE = 0.0825; // 8.25% sales tax
export const PROCESSING_FEE_RATE = 0.03; // 3% processing fee
export const SPECIFIC_TIME_CHARGE = 50; // $50 charge for specific delivery/pickup times

// Default values
export const DEFAULT_DELIVERY_FEE = 0; // FREE DELIVERY
export const DEFAULT_DISCOUNT_AMOUNT = 0;
export const DEFAULT_DEPOSIT_AMOUNT = 0;
export const DEFAULT_ORDER_STATUS = "Pending" as const;
export const DEFAULT_PAYMENT_STATUS = "Pending" as const;
export const DEFAULT_PAYMENT_METHOD = "paypal" as const;
export const DEFAULT_DELIVERY_TIME_PREFERENCE = "flexible" as const;
export const DEFAULT_PICKUP_TIME_PREFERENCE = "flexible" as const;
export const DEFAULT_SPECIFIC_TIME_CHARGE = 0;

// Validation constants
export const MIN_ITEMS_REQUIRED = 1;
export const MIN_PRICE = 0;
export const MIN_QUANTITY = 1;

/**
 * Utility function to calculate tax amount
 */
export const calculateTaxAmount = (subtotal: number): number => {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
};

/**
 * Utility function to calculate processing fee
 */
export const calculateProcessingFee = (subtotal: number): number => {
  return Math.round(subtotal * PROCESSING_FEE_RATE * 100) / 100;
};

/**
 * Utility function to calculate total amount
 */
export const calculateTotalAmount = (
  subtotal: number,
  taxAmount: number,
  deliveryFee: number,
  processingFee: number,
  discountAmount: number,
  specificTimeCharge: number = 0,
): number => {
  return (
    Math.round(
      (subtotal +
        taxAmount +
        deliveryFee +
        processingFee +
        specificTimeCharge -
        discountAmount) *
        100,
    ) / 100
  );
};

/**
 * Utility function to calculate balance due
 */
export const calculateBalanceDue = (
  totalAmount: number,
  depositAmount: number,
): number => {
  return Math.round((totalAmount - depositAmount) * 100) / 100;
};

/**
 * Comprehensive order pricing calculation utility
 */
export interface OrderPricingCalculation {
  subtotal: number;
  taxAmount: number;
  processingFee: number;
  totalAmount: number;
  balanceDue: number;
}

export const calculateOrderPricing = (
  items: Array<{ totalPrice: number }>,
  deliveryFee: number = DEFAULT_DELIVERY_FEE,
  discountAmount: number = DEFAULT_DISCOUNT_AMOUNT,
  depositAmount: number = DEFAULT_DEPOSIT_AMOUNT,
  specificTimeCharge: number = DEFAULT_SPECIFIC_TIME_CHARGE,
): OrderPricingCalculation => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = calculateTaxAmount(subtotal);
  const processingFee = calculateProcessingFee(subtotal);
  const totalAmount = calculateTotalAmount(
    subtotal,
    taxAmount,
    deliveryFee,
    processingFee,
    discountAmount,
    specificTimeCharge,
  );
  const balanceDue = calculateBalanceDue(totalAmount, depositAmount);

  return {
    subtotal,
    taxAmount,
    processingFee,
    totalAmount,
    balanceDue,
  };
};
