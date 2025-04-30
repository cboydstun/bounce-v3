import { CheckoutState } from "./types";

/**
 * Calculate the number of days between delivery and pickup dates
 */
const calculateRentalDays = (
  deliveryDate: string,
  pickupDate: string,
): number => {
  if (!deliveryDate || !pickupDate) return 0;

  // Parse dates to ensure consistent behavior
  const [deliveryYear, deliveryMonth, deliveryDay] = deliveryDate
    .split("-")
    .map(Number);
  const [pickupYear, pickupMonth, pickupDay] = pickupDate
    .split("-")
    .map(Number);

  // Create date objects (using noon to avoid timezone issues)
  const delivery = new Date(
    deliveryYear,
    deliveryMonth - 1,
    deliveryDay,
    12,
    0,
    0,
  );
  const pickup = new Date(pickupYear, pickupMonth - 1, pickupDay, 12, 0, 0);

  // Calculate the difference in days
  const diffTime = pickup.getTime() - delivery.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Calculate prices based on the selected bouncers and extras
 */
export const calculatePrices = (state: CheckoutState) => {
  // Calculate the number of days between delivery and pickup
  const daysDifference = calculateRentalDays(
    state.deliveryDate,
    state.pickupDate,
  );

  // For display purposes
  const rentalDays = Math.max(1, daysDifference);

  // Determine pricing multiplier based on rental days
  let dayMultiplier = 1;
  let overnightFee = 0;

  if (daysDifference === 0) {
    // Same day rental - base price
    dayMultiplier = 1;
  } else if (daysDifference === 1) {
    // Overnight rental - add $50 fee
    dayMultiplier = 1;
    overnightFee = 50;

    // We still automatically select the "overnight" extra in the UI,
    // but we don't count its price in the calculation to avoid double-charging
  } else if (daysDifference === 2) {
    // Two-day rental - multiply by 2
    dayMultiplier = 2;
  } else {
    // Multi-day rental (3+ days) - multiply by number of days
    dayMultiplier = daysDifference;
  }

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

      // Apply day multiplier to the bouncer price
      const priceWithDays = discountedPrice * dayMultiplier;

      bouncerSubtotal += priceWithDays; // No need to multiply by quantity since it's always 1

      // Update the discounted price for display purposes
      bouncer.discountedPrice = discountedPrice;
    });
  } else if (state.selectedBouncer) {
    // Fallback to legacy single bouncer
    bouncerSubtotal = state.bouncerPrice * dayMultiplier;
  }

  // Calculate mixer total (exclude 'none' mixers)
  const mixerTotal = state.slushyMixers
    .filter((mixer) => mixer.mixerId !== "none")
    .reduce((sum, mixer) => sum + mixer.price * dayMultiplier, 0);

  // Calculate extras total (including mixers)
  const extrasTotal =
    state.extras
      .filter((extra) => extra.selected)
      .reduce((sum: number, extra) => {
        // Only apply quantity for Tables & Chairs
        const quantity = extra.id === "tablesChairs" ? extra.quantity : 1;

        // Apply day multiplier to extras
        return sum + extra.price * quantity * dayMultiplier;
      }, 0) + mixerTotal;

  // Include specific time charge and delivery fee in the subtotal
  // Note: These are NOT multiplied by the day count
  const specificTimeCharge = state.specificTimeCharge || 0;
  const deliveryFee = 20; // Fixed at $20

  // Calculate subtotal (including overnight fee for 1-night rentals)
  const subtotal =
    bouncerSubtotal +
    extrasTotal +
    specificTimeCharge +
    deliveryFee +
    overnightFee;

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
    overnightFee,
    dayMultiplier,
    rentalDays,
    totalAmount,
    depositAmount,
    balanceDue,
  };
};
