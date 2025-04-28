import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Step3_Extras from "../Step3_Extras";

// Mock state with extras
const mockState = {
  // Current step
  currentStep: "extras" as const,

  // Step 1: Rental Selection
  selectedBouncer: "castle",
  bouncerName: "Castle Bouncer",
  bouncerPrice: 150,
  deliveryDate: "2025-05-01",
  deliveryTime: "10:00",
  deliveryTimePreference: "flexible" as const,
  pickupDate: "2025-05-01",
  pickupTime: "18:00",
  pickupTimePreference: "flexible" as const,
  specificTimeCharge: 0,

  // Step 2: Delivery Information
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "555-123-4567",
  customerAddress: "123 Main St",
  customerCity: "San Antonio",
  customerState: "TX",
  customerZipCode: "78201",
  deliveryInstructions: "Place in backyard",

  // Step 3: Extras
  extras: [
    {
      id: "tablesChairs",
      name: "Tables & Chairs",
      price: 25,
      selected: false,
      quantity: 1,
      image: "🪑",
    },
    {
      id: "generator",
      name: "Generator",
      price: 50,
      selected: false,
      quantity: 1,
      image: "⚡",
    },
  ],

  // Step 4: Order Review
  subtotal: 150,
  taxAmount: 12.38,
  deliveryFee: 0,
  processingFee: 4.5,
  discountAmount: 0,
  totalAmount: 166.88,
  agreedToTerms: false,

  // Step 5: Payment
  paymentMethod: "paypal" as const,
  paymentStatus: "Pending" as const,
  orderId: "",
  orderNumber: "",
  paymentComplete: false,
  paymentError: null,

  // Form validation
  errors: {},
  isFormValid: true,
};

// Mock dispatch function
const mockDispatch = jest.fn();

describe("Step3_Extras Component", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  test("should show quantity controls only for Tables & Chairs when selected", () => {
    // Create a copy of the state with Tables & Chairs selected
    const stateWithTablesChairsSelected = {
      ...mockState,
      extras: [
        {
          ...mockState.extras[0],
          selected: true,
        },
        mockState.extras[1],
      ],
    };

    render(
      <Step3_Extras
        state={stateWithTablesChairsSelected}
        dispatch={mockDispatch}
      />,
    );

    // Should find quantity controls for Tables & Chairs
    expect(screen.getByText("1")).toBeInTheDocument(); // Quantity display
    expect(
      screen.getByText("Each set includes 1 table and 6 chairs"),
    ).toBeInTheDocument();

    // Find buttons by their SVG paths
    const plusButton = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "button" &&
        element.querySelector(
          'svg path[d*="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5"]',
        ) !== null
      );
    });
    const minusButton = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "button" &&
        element.querySelector(
          'svg path[d*="M3 10a1 1 0 011-1h12a1 1 0 110 2H4"]',
        ) !== null
      );
    });

    expect(plusButton).toBeInTheDocument();
    expect(minusButton).toBeInTheDocument();
  });

  test("should NOT show quantity controls for other extras when selected", () => {
    // Create a copy of the state with Generator selected
    const stateWithGeneratorSelected = {
      ...mockState,
      extras: [
        mockState.extras[0],
        {
          ...mockState.extras[1],
          selected: true,
        },
      ],
    };

    render(
      <Step3_Extras
        state={stateWithGeneratorSelected}
        dispatch={mockDispatch}
      />,
    );

    // Should NOT find "Quantity: 1" text for Generator
    expect(screen.queryByText("Quantity: 1")).not.toBeInTheDocument();

    // Should NOT find quantity controls
    const incrementButtons = screen.queryAllByRole("button", {
      name: /increment/i,
    });
    const decrementButtons = screen.queryAllByRole("button", {
      name: /decrement/i,
    });
    expect(incrementButtons.length).toBe(0);
    expect(decrementButtons.length).toBe(0);
  });

  test("should allow changing quantity for Tables & Chairs", () => {
    // Create a copy of the state with Tables & Chairs selected
    const stateWithTablesChairsSelected = {
      ...mockState,
      extras: [
        {
          ...mockState.extras[0],
          selected: true,
        },
        mockState.extras[1],
      ],
    };

    render(
      <Step3_Extras
        state={stateWithTablesChairsSelected}
        dispatch={mockDispatch}
      />,
    );

    // Find plus button by SVG path and click it
    const plusButton = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === "button" &&
        element.querySelector(
          'svg path[d*="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5"]',
        ) !== null
      );
    });
    fireEvent.click(plusButton);

    // Dispatch should be called with INCREMENT_EXTRA_QUANTITY action
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "INCREMENT_EXTRA_QUANTITY",
      payload: "tablesChairs",
    });
  });
});
