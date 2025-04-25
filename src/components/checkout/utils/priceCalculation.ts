import { CheckoutState } from "./types";

/**
 * Calculate prices based on the selected bouncer and extras
 */
export const calculatePrices = (state: CheckoutState) => {
  // Calculate subtotal from bouncer and selected extras
  const extrasTotal = state.extras
    .filter((extra) => extra.selected)
    .reduce((sum: number, extra) => {
      // Only apply quantity for Tables & Chairs
      const quantity = extra.id === "tablesChairs" ? extra.quantity : 1;
      return sum + (extra.price * quantity);
    }, 0);

  // Include specific time charge in the subtotal
  const specificTimeCharge = state.specificTimeCharge || 0;
  const subtotal = state.bouncerPrice + extrasTotal + specificTimeCharge;

  // Calculate tax (8.25%)
  const taxAmount = parseFloat((subtotal * 0.0825).toFixed(2));

  // Delivery fee is fixed at $20
  const deliveryFee = 20;

  // Processing fee is 3% of subtotal
  const processingFee = parseFloat((subtotal * 0.03).toFixed(2));

  // Calculate total
  const totalAmount = parseFloat(
    (
      subtotal +
      taxAmount +
      deliveryFee +
      processingFee -
      (state.discountAmount || 0)
    ).toFixed(2),
  );

  return {
    subtotal,
    taxAmount,
    deliveryFee,
    processingFee,
    specificTimeCharge,
    totalAmount,
  };
};
