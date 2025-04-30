import { CheckoutState } from "./types";

/**
 * Calculate prices based on the selected bouncers and extras
 */
export const calculatePrices = (state: CheckoutState) => {
  // Calculate bouncer subtotal with discounts
  let bouncerSubtotal = 0;

  // If we have bouncers in the new array, use those
  if (state.selectedBouncers.length > 0) {
    // IMPORTANT: Always sort bouncers by price (highest to lowest)
    // This ensures the most expensive bouncer gets full price
    // and cheaper bouncers get the 50% discount, regardless of selection order
    const sortedBouncers = [...state.selectedBouncers].sort(
      (a, b) => b.price - a.price,
    );

    // Apply discounts: most expensive bouncer (index 0) gets full price,
    // additional bouncers get 50% off
    // Each bouncer has a fixed quantity of 1
    sortedBouncers.forEach((bouncer, index) => {
      const discount = index === 0 ? 1 : 0.5;
      const discountedPrice = bouncer.price * discount;
      bouncerSubtotal += discountedPrice; // No need to multiply by quantity since it's always 1

      // Update the discounted price for display purposes
      bouncer.discountedPrice = discountedPrice;
    });
  } else if (state.selectedBouncer) {
    // Fallback to legacy single bouncer
    bouncerSubtotal = state.bouncerPrice;
  }

  // Calculate extras total
  const extrasTotal = state.extras
    .filter((extra) => extra.selected)
    .reduce((sum: number, extra) => {
      // Only apply quantity for Tables & Chairs
      const quantity = extra.id === "tablesChairs" ? extra.quantity : 1;
      return sum + extra.price * quantity;
    }, 0);

  // Include specific time charge and delivery fee in the subtotal
  const specificTimeCharge = state.specificTimeCharge || 0;
  const deliveryFee = 20; // Fixed at $20
  const subtotal =
    bouncerSubtotal + extrasTotal + specificTimeCharge + deliveryFee;

  // Calculate tax (8.25%)
  const taxAmount = parseFloat((subtotal * 0.0825).toFixed(2));

  // Processing fee is 3% of (subtotal + tax) for PayPal payments only
  const processingFee =
    state.paymentMethod === "cash"
      ? 0
      : parseFloat(((subtotal + taxAmount) * 0.03).toFixed(2));

  // Calculate total
  const totalAmount = parseFloat(
    (
      subtotal +
      taxAmount +
      processingFee -
      (state.discountAmount || 0)
    ).toFixed(2),
  );

  // Calculate balance due based on deposit amount
  const depositAmount = state.depositAmount || 0;
  const balanceDue = parseFloat((totalAmount - depositAmount).toFixed(2));

  return {
    subtotal,
    taxAmount,
    deliveryFee,
    processingFee,
    specificTimeCharge,
    totalAmount,
    depositAmount,
    balanceDue,
  };
};
