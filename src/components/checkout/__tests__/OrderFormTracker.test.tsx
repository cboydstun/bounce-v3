import { render } from "@testing-library/react";
import OrderFormTracker from "../OrderFormTracker";
import { OrderStep, CheckoutState } from "../utils/types";

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.gtag
Object.defineProperty(window, "gtag", {
  value: jest.fn(),
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, "sendBeacon", {
  value: jest.fn(),
});

describe("OrderFormTracker", () => {
  const mockFormData: CheckoutState = {
    currentStep: "selection" as OrderStep,
    selectedBouncers: [],
    selectedBouncer: "test-bouncer",
    bouncerName: "Test Bouncer",
    bouncerPrice: 100,
    availabilityChecks: {
      status: "idle",
      results: {},
      lastCheckedDate: null,
    },
    deliveryDate: "2024-01-01",
    deliveryTime: "10:00 AM",
    deliveryTimePreference: "flexible",
    pickupDate: "2024-01-02",
    pickupTime: "6:00 PM",
    pickupTimePreference: "flexible",
    specificTimeCharge: 0,
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "555-1234",
    customerAddress: "123 Test St",
    customerCity: "Test City",
    customerState: "TX",
    customerZipCode: "12345",
    extras: [],
    slushyMixers: [],
    subtotal: 100,
    taxAmount: 0,
    deliveryFee: 20,
    processingFee: 0,
    discountAmount: 0,
    totalAmount: 100,
    agreedToTerms: false,
    paymentMethod: "paypal",
    paymentStatus: "Pending",
    orderId: "",
    orderNumber: "",
    paymentComplete: false,
    paymentError: null,
    orderStatus: "Pending",
    paypalTransactions: [],
    depositAmount: 0,
    balanceDue: 100,
    tasks: [],
    errors: {},
    isFormValid: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue("test-visitor-id");
  });

  it("should render without crashing", () => {
    render(
      <OrderFormTracker currentStep="selection" formData={mockFormData} />,
    );
  });

  it("should handle fetch failures gracefully", async () => {
    // Mock fetch to reject
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(
      <OrderFormTracker currentStep="selection" formData={mockFormData} />,
    );

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not crash and should log error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should handle missing visitorId gracefully", async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(
      <OrderFormTracker currentStep="selection" formData={mockFormData} />,
    );

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should log error about missing visitorId
    expect(consoleSpy).toHaveBeenCalledWith(
      "No visitorId found in localStorage",
    );

    consoleSpy.mockRestore();
  });

  it("should retry failed requests", async () => {
    // Mock fetch to fail first time, succeed second time
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    render(
      <OrderFormTracker currentStep="selection" formData={mockFormData} />,
    );

    // Wait for retry logic
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Should have logged retry attempt
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Retrying checkout event tracking"),
    );

    consoleSpy.mockRestore();
  });

  it("should use fallback tracking when all retries fail", async () => {
    // Mock fetch to always fail
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    const sendBeaconSpy = jest.spyOn(navigator, "sendBeacon");
    const gtagSpy = jest.spyOn(window, "gtag");

    render(
      <OrderFormTracker currentStep="selection" formData={mockFormData} />,
    );

    // Wait for all retries to complete
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Should have attempted fallback tracking
    expect(sendBeaconSpy).toHaveBeenCalled();
    expect(gtagSpy).toHaveBeenCalled();
  });

  it("should store failed events in localStorage", async () => {
    // Mock fetch to always fail
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(
      <OrderFormTracker currentStep="selection" formData={mockFormData} />,
    );

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have stored failed event
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "failedTracking_checkout",
      expect.any(String),
    );
  });

  it("should sanitize sensitive data", async () => {
    const formDataWithSensitiveInfo = {
      ...mockFormData,
      customerEmail: "sensitive@example.com",
      customerPhone: "555-1234",
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <OrderFormTracker
        currentStep="selection"
        formData={formDataWithSensitiveInfo}
      />,
    );

    // Wait for tracking call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that fetch was called with sanitized data
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/visitors",
      expect.objectContaining({
        body: expect.not.stringContaining("sensitive@example.com"),
      }),
    );
  });
});
