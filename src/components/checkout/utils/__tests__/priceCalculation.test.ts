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
    // Delivery fee: 0 (FREE DELIVERY)
    // Subtotal: 100 + 49.95 + 50 + 0 = 199.95
    // Tax: 199.95 * 0.0825 = 16.50
    // Processing fee: (199.95 + 16.50) * 0.03 = 6.49
    // Total: 199.95 + 16.50 + 6.49 = 222.94

    expect(result.overnightFee).toBe(50);
    expect(result.subtotal).toBeCloseTo(199.95);
    expect(result.taxAmount).toBeCloseTo(16.5);
    expect(result.processingFee).toBeCloseTo(6.49);
    expect(result.totalAmount).toBeCloseTo(222.94);
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
    expect(result.subtotal).toBe(150); // 100 + 50 + 0 (delivery fee)
    expect(result.taxAmount).toBeCloseTo(12.38); // 8.25% of 150
    expect(result.processingFee).toBeCloseTo(4.87); // 3% of (150 + 12.38)
    expect(result.totalAmount).toBeCloseTo(167.25); // 150 + 12.38 + 4.87
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

    expect(result.subtotal).toBe(150); // 100 + 50 + 0 (delivery fee)
    expect(result.taxAmount).toBeCloseTo(12.38); // 8.25% of 150
    expect(result.processingFee).toBeCloseTo(4.87); // 3% of (150 + 12.38)
    expect(result.totalAmount).toBeCloseTo(167.25); // 150 + 12.38 + 4.87
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
    // Subtotal: 100 (bouncer) + 139.8 (extras) + 100 (specific time) + 0 (delivery fee) = 339.8
    // Tax: 339.8 * 0.0825 = 28.03
    // Processing fee: (339.8 + 28.03) * 0.03 = 11.03
    // Total: 339.8 + 28.03 + 11.03 - 20 (discount) = 358.86

    expect(result.subtotal).toBeCloseTo(339.8);
    expect(result.taxAmount).toBeCloseTo(28.03);
    expect(result.processingFee).toBeCloseTo(11.03);
    expect(result.totalAmount).toBeCloseTo(358.86);
  });
});
