import { calculatePrices } from '../priceCalculation';
import { CheckoutState } from '../types';

describe('calculatePrices', () => {
  // Test case for basic price calculation
  test('basic price calculation with specific time charge', () => {
    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      extras: [],
      specificTimeCharge: 50,
      discountAmount: 0
    };
    
    const result = calculatePrices(mockState as CheckoutState);
    
    // specificTimeCharge is now part of subtotal
    expect(result.subtotal).toBe(150); // 100 + 50
    expect(result.taxAmount).toBeCloseTo(12.38); // 8.25% of 150
    expect(result.processingFee).toBeCloseTo(4.50); // 3% of 150
    expect(result.totalAmount).toBeCloseTo(186.88); // 150 + 12.38 + 20 + 4.50
  });

  // Test case for the fixed behavior
  test('fixed behavior: specific time charge included in subtotal', () => {
    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      extras: [],
      specificTimeCharge: 50,
      discountAmount: 0
    };
    
    // After fix, we expect:
    // - subtotal to include specificTimeCharge (100 + 50 = 150)
    // - taxAmount to be 8.25% of 150 = 12.38
    // - processingFee to be 3% of 150 = 4.50
    // - totalAmount to be 150 + 12.38 + 20 + 4.50 = 186.88
    
    // This test will fail with the current implementation
    // and pass after the fix is implemented
    const result = calculatePrices(mockState as CheckoutState);
    
    expect(result.subtotal).toBe(150); // Now includes specificTimeCharge
    expect(result.taxAmount).toBeCloseTo(12.38); // 8.25% of 150
    expect(result.processingFee).toBeCloseTo(4.50); // 3% of 150
    expect(result.totalAmount).toBeCloseTo(186.88); // 150 + 12.38 + 20 + 4.50
  });

  // Test with extras and specific time charge
  test('calculates prices correctly with extras and specific time charge', () => {
    const mockState: Partial<CheckoutState> = {
      bouncerPrice: 100,
      extras: [
        { id: 'popcornMachine', name: 'Popcorn Machine', price: 49.95, selected: true, quantity: 1, image: '🍿' },
        { id: 'generator', name: 'Generator', price: 49.95, selected: true, quantity: 1, image: '⚡' },
        { id: 'tablesChairs', name: 'Tables & Chairs', price: 19.95, selected: true, quantity: 2, image: '🪑' }
      ],
      specificTimeCharge: 100, // Both delivery and pickup specific times
      discountAmount: 20
    };
    
    const result = calculatePrices(mockState as CheckoutState);
    
    // Expected calculations after fix:
    // Extras total: 49.95 + 49.95 + (19.95 * 2) = 139.8
    // Subtotal: 100 (bouncer) + 139.8 (extras) + 100 (specific time) = 339.8
    // Tax: 339.8 * 0.0825 = 28.03
    // Processing fee: 339.8 * 0.03 = 10.19
    // Total: 339.8 + 28.03 + 20 (delivery) + 10.19 - 20 (discount) = 378.02
    
    expect(result.subtotal).toBeCloseTo(339.8);
    expect(result.taxAmount).toBeCloseTo(28.03);
    expect(result.processingFee).toBeCloseTo(10.19);
    expect(result.totalAmount).toBeCloseTo(378.02);
  });
});
