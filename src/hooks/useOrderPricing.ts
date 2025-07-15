import { useMemo, useCallback } from "react";

interface OrderItem {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PricingData {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  processingFee: number;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
}

const TAX_RATE = 0.0825; // 8.25%
const PROCESSING_FEE_RATE = 0.03; // 3%

/**
 * Custom hook for real-time order pricing calculations
 * @param items - Array of order items
 * @param deliveryFee - Delivery fee amount
 * @param discountAmount - Discount amount
 * @param depositAmount - Deposit amount
 * @returns Object with pricing calculations and helper functions
 */
export function useOrderPricing(
  items: OrderItem[],
  deliveryFee: number = 0,
  discountAmount: number = 0,
  depositAmount: number = 0,
) {
  // Memoized pricing calculations for performance
  const pricing = useMemo((): PricingData => {
    // Calculate subtotal from all items
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Calculate processing fee (3% of subtotal)
    const processingFee = subtotal * PROCESSING_FEE_RATE;

    // Calculate tax on subtotal + delivery fee + processing fee - discount
    const taxableAmount = Math.max(
      0,
      subtotal + deliveryFee + processingFee - discountAmount,
    );
    const taxAmount = taxableAmount * TAX_RATE;

    // Calculate total amount
    const totalAmount =
      subtotal + deliveryFee + processingFee + taxAmount - discountAmount;

    // Calculate balance due
    const balanceDue = Math.max(0, totalAmount - depositAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      processingFee: Math.round(processingFee * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      depositAmount: Math.round(depositAmount * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
    };
  }, [items, deliveryFee, discountAmount, depositAmount]);

  // Helper function to calculate item total price
  const calculateItemTotal = useCallback(
    (quantity: number, unitPrice: number): number => {
      return Math.round(quantity * unitPrice * 100) / 100;
    },
    [],
  );

  // Helper function to validate pricing
  const validatePricing = useCallback(() => {
    const warnings: string[] = [];

    if (pricing.subtotal <= 0) {
      warnings.push(
        "Order must contain at least one item with a price greater than $0",
      );
    }

    if (discountAmount > pricing.subtotal) {
      warnings.push("Discount amount cannot be greater than subtotal");
    }

    if (depositAmount > pricing.totalAmount) {
      warnings.push("Deposit amount cannot be greater than total amount");
    }

    if (pricing.totalAmount < 0) {
      warnings.push("Total amount cannot be negative");
    }

    return warnings;
  }, [pricing, discountAmount, depositAmount]);

  // Helper function to suggest optimal deposit amount
  const suggestDepositAmount = useCallback((): number => {
    // Suggest 50% of total as deposit, minimum $50, maximum total amount
    const suggestedDeposit = Math.max(50, pricing.totalAmount * 0.5);
    return Math.min(suggestedDeposit, pricing.totalAmount);
  }, [pricing.totalAmount]);

  // Helper function to format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }, []);

  // Helper function to get pricing breakdown for display
  const getPricingBreakdown = useCallback(() => {
    return [
      { label: "Subtotal", amount: pricing.subtotal, type: "positive" },
      { label: "Delivery Fee", amount: pricing.deliveryFee, type: "positive" },
      {
        label: "Processing Fee (3%)",
        amount: pricing.processingFee,
        type: "positive",
      },
      { label: "Discount", amount: -pricing.discountAmount, type: "negative" },
      { label: "Tax (8.25%)", amount: pricing.taxAmount, type: "positive" },
      { label: "Total Amount", amount: pricing.totalAmount, type: "total" },
      { label: "Deposit", amount: -pricing.depositAmount, type: "negative" },
      { label: "Balance Due", amount: pricing.balanceDue, type: "balance" },
    ].filter((item) => item.amount !== 0);
  }, [pricing]);

  // Helper function to check if pricing has changed
  const hasPricingChanged = useCallback(
    (previousPricing: PricingData): boolean => {
      return JSON.stringify(pricing) !== JSON.stringify(previousPricing);
    },
    [pricing],
  );

  return {
    pricing,
    calculateItemTotal,
    validatePricing,
    suggestDepositAmount,
    formatCurrency,
    getPricingBreakdown,
    hasPricingChanged,
  };
}
