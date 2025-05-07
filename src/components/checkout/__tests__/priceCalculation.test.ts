import { calculatePrices } from "../utils/priceCalculation";
import { CheckoutState, EXTRAS } from "../utils/types";

describe("calculatePrices", () => {
  // Create a base state for testing
  const createBaseState = (): Partial<CheckoutState> => ({
    selectedBouncers: [
      {
        id: "bouncer1",
        name: "Test Bouncer",
        price: 100,
        quantity: 1,
      },
    ],
    extras: EXTRAS.map((extra) => ({
      ...extra,
      selected: false,
      quantity: 1,
    })),
    slushyMixers: [],
    specificTimeCharge: 0,
    deliveryDate: "2025-05-05",
    pickupDate: "2025-05-05",
    paymentMethod: "paypal",
    discountAmount: 0,
    depositAmount: 0,
  });

  test("should calculate correct price for same-day rental", () => {
    const state = createBaseState();
    const prices = calculatePrices(state as CheckoutState);

    // Base price + delivery fee ($20)
    expect(prices.subtotal).toBe(120);
  });

  test("should add $50 for overnight rental", () => {
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-06", // Next day pickup
    };

    const prices = calculatePrices(state as CheckoutState);

    // Base price + delivery fee ($20) + overnight fee ($50)
    expect(prices.subtotal).toBe(170);
  });

  test("should multiply base price by 2 for two-day rental", () => {
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-07", // Two days later
    };

    const prices = calculatePrices(state as CheckoutState);

    // (Base price × 2) + delivery fee ($20)
    expect(prices.subtotal).toBe(220);
  });

  test("should multiply base price by 3 for three-day rental", () => {
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-08", // Three days later
    };

    const prices = calculatePrices(state as CheckoutState);

    // (Base price × 3) + delivery fee ($20)
    expect(prices.subtotal).toBe(320);
  });

  test("should apply day multiplier to extras as well", () => {
    // Create state with an extra selected
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-07", // Two days later
      extras: EXTRAS.map((extra) => ({
        ...extra,
        selected: extra.id === "generator", // Select the generator ($49.95)
        quantity: 1,
      })),
    };

    const prices = calculatePrices(state as CheckoutState);

    // (Base price × 2) + (generator price × 2) + delivery fee ($20)
    // 100 × 2 + 49.95 × 2 + 20 = 319.9
    expect(prices.subtotal).toBeCloseTo(319.9, 1);
  });

  test("should not multiply delivery fee or specific time charge", () => {
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-07", // Two days later
      specificTimeCharge: 10, // Add specific time charge
    };

    const prices = calculatePrices(state as CheckoutState);

    // (Base price × 2) + delivery fee ($20) + specific time charge ($10)
    // 100 × 2 + 20 + 10 = 230
    expect(prices.subtotal).toBe(230);
  });

  test("should handle overnight rental with extras", () => {
    // Create state with an extra selected
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-06", // Next day pickup (overnight)
      extras: EXTRAS.map((extra) => ({
        ...extra,
        selected: extra.id === "generator", // Select the generator ($49.95)
        quantity: 1,
      })),
    };

    const prices = calculatePrices(state as CheckoutState);

    // Base price + generator price + delivery fee ($20) + overnight fee ($50)
    // 100 + 49.95 + 20 + 50 = 219.95
    expect(prices.subtotal).toBeCloseTo(219.95, 1);
  });

  test("should apply quantity for tables & chairs", () => {
    // Create state with tables & chairs selected with quantity 2
    const state = {
      ...createBaseState(),
      pickupDate: "2025-05-07", // Two days later
      extras: EXTRAS.map((extra) => ({
        ...extra,
        selected: extra.id === "tablesChairs",
        quantity: extra.id === "tablesChairs" ? 2 : 1,
      })),
    };

    const prices = calculatePrices(state as CheckoutState);

    // (Base price × 2) + (tables & chairs price × quantity × 2) + delivery fee ($20)
    // 100 × 2 + 19.95 × 2 × 2 + 20 = 299.8
    expect(prices.subtotal).toBeCloseTo(299.8, 1);
  });
});
