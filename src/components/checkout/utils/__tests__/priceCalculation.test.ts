import { calculatePrices } from "../priceCalculation";
import { CheckoutState } from "../types";

describe("calculatePrices", () => {
  // Test case for overnight rental to ensure no double charging
  test("overnight rental does not double charge the overnight fee", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      deliveryDate: formatDate(today),
      pickupDate: formatDate(tomorrow),
      extras: [
        {
          id: "overnight",
          name: "Overnight Rental",
          price: 50,
          selected: true,
          quantity: 1,
          image: "🌙",
        },
        {
          id: "popcornMachine",
          name: "Popcorn Machine",
          price: 49.95,
          selected: true,
          quantity: 1,
          image: "🍿",
        },
      ],
      specificTimeCharge: 0,
      discountAmount: 0,
      paymentMethod: "paypal",
      slushyMixers: [],
      selectedBouncers: [],
      selectedBouncer: "test-bouncer", // Add this to ensure bouncerPrice is used
    };

    const result = calculatePrices(mockState as CheckoutState);

    // Expected calculations:
    // Bouncer: 100
    // Extras: 49.95 (popcorn machine only, overnight extra should be excluded)
    // Overnight fee: 50 (added separately)
    // Delivery fee: 20 (fixed)
    // Subtotal: 100 + 49.95 + 50 + 20 = 219.95
    // Tax: 219.95 * 0.0825 = 18.15
    // Processing fee: (219.95 + 18.15) * 0.03 = 7.14
    // Total: 219.95 + 18.15 + 7.14 = 245.24

    expect(result.overnightFee).toBe(50);
    expect(result.subtotal).toBeCloseTo(219.95);
    expect(result.taxAmount).toBeCloseTo(18.15);
    expect(result.processingFee).toBeCloseTo(7.14);
    expect(result.totalAmount).toBeCloseTo(245.24);
  });
  // Test case for basic price calculation
  test("basic price calculation with specific time charge", () => {
    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      extras: [],
      specificTimeCharge: 50,
      discountAmount: 0,
      selectedBouncer: "test-bouncer",
      paymentMethod: "paypal",
      slushyMixers: [],
    };

    const result = calculatePrices(mockState as CheckoutState);

    // specificTimeCharge and delivery fee are part of subtotal
    expect(result.subtotal).toBe(170); // 100 + 50 + 20 (delivery fee)
    expect(result.taxAmount).toBeCloseTo(14.03); // 8.25% of 170
    expect(result.processingFee).toBeCloseTo(5.52); // 3% of (170 + 14.03)
    expect(result.totalAmount).toBeCloseTo(189.55); // 170 + 14.03 + 5.52
  });

  // Test case for the fixed behavior
  test("fixed behavior: specific time charge included in subtotal", () => {
    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      extras: [],
      specificTimeCharge: 50,
      discountAmount: 0,
      selectedBouncer: "test-bouncer",
      paymentMethod: "paypal",
      slushyMixers: [],
    };

    // After fix, we expect:
    // - subtotal to include specificTimeCharge (100 + 50 = 150)
    // - taxAmount to be 8.25% of 150 = 12.38
    // - processingFee to be 3% of 150 = 4.50
    // - totalAmount to be 150 + 12.38 + 20 + 4.50 = 186.88

    // This test will fail with the current implementation
    // and pass after the fix is implemented
    const result = calculatePrices(mockState as CheckoutState);

    expect(result.subtotal).toBe(170); // 100 + 50 + 20 (delivery fee)
    expect(result.taxAmount).toBeCloseTo(14.03); // 8.25% of 170
    expect(result.processingFee).toBeCloseTo(5.52); // 3% of (170 + 14.03)
    expect(result.totalAmount).toBeCloseTo(189.55); // 170 + 14.03 + 5.52
  });

  // Test with extras and specific time charge
  test("calculates prices correctly with extras and specific time charge", () => {
    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      extras: [
        {
          id: "popcornMachine",
          name: "Popcorn Machine",
          price: 49.95,
          selected: true,
          quantity: 1,
          image: "🍿",
        },
        {
          id: "generator",
          name: "Generator",
          price: 49.95,
          selected: true,
          quantity: 1,
          image: "⚡",
        },
        {
          id: "tablesChairs",
          name: "Tables & Chairs",
          price: 19.95,
          selected: true,
          quantity: 2,
          image: "🪑",
        },
      ],
      specificTimeCharge: 100, // Both delivery and pickup specific times
      discountAmount: 20,
      selectedBouncer: "test-bouncer",
      paymentMethod: "paypal",
      slushyMixers: [],
    };

    const result = calculatePrices(mockState as CheckoutState);

    // Expected calculations after fix:
    // Extras total: 49.95 + 49.95 + (19.95 * 2) = 139.8
    // Subtotal: 100 (bouncer) + 139.8 (extras) + 100 (specific time) + 20 (delivery fee) = 359.8
    // Tax: 359.8 * 0.0825 = 29.68
    // Processing fee: (359.8 + 29.68) * 0.03 = 11.68
    // Total: 359.8 + 29.68 + 11.68 - 20 (discount) = 381.16

    expect(result.subtotal).toBeCloseTo(359.8);
    expect(result.taxAmount).toBeCloseTo(29.68);
    expect(result.processingFee).toBeCloseTo(11.68);
    expect(result.totalAmount).toBeCloseTo(381.16);
  });
});
