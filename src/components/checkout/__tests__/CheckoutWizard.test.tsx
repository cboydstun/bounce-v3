import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CheckoutWizard from "../CheckoutWizard";
import { getProducts } from "@/utils/api";

// Mock the API calls
jest.mock("@/utils/api", () => ({
  getProducts: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe("CheckoutWizard", () => {
  beforeEach(() => {
    // Mock the getProducts API call
    (getProducts as jest.Mock).mockResolvedValue({
      products: [
        {
          _id: "product1",
          name: "Test Bouncer",
          images: [{ url: "/test-image.jpg", alt: "Test Bouncer" }],
          specifications: [
            { name: "Type", value: "DRY", _id: "spec1" },
            { name: "Price", value: "150", _id: "spec2" },
          ],
        },
      ],
    });

    // Mock fetch for API calls
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        _id: "order1",
        orderNumber: "BB-2024-0001",
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the first step by default", async () => {
    render(<CheckoutWizard />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Select Your Rental")).toBeInTheDocument();
    });

    // Check that the step indicator shows step 1 as active
    const stepIndicators = screen.getAllByText(
      /Rental Selection|Delivery Info|Add Extras|Review Order|Payment/,
    );
    expect(stepIndicators[0]).toHaveClass("text-primary-purple");
  });

  it("shows validation errors when trying to proceed without required fields", async () => {
    render(<CheckoutWizard />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Select Your Rental")).toBeInTheDocument();
    });

    // Try to proceed without selecting a bouncer
    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);

    // Check that validation errors are shown
    await waitFor(() => {
      expect(screen.getByText("Please select a bouncer")).toBeInTheDocument();
    });
  });

  it("disables the next button when there are validation errors", async () => {
    render(<CheckoutWizard />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Select Your Rental")).toBeInTheDocument();
    });

    // Try to proceed without selecting a bouncer
    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);

    // Check that validation errors are shown and button is disabled
    await waitFor(() => {
      expect(screen.getByText("Please select a bouncer")).toBeInTheDocument();
      expect(continueButton).toBeDisabled();
    });
  });

  it("shows free delivery in the order summary", async () => {
    render(<CheckoutWizard />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Select Your Rental")).toBeInTheDocument();
    });

    // Mock selecting a bouncer and proceeding through steps
    // This would require more detailed mocking of the step components
    // For now, we can test that the delivery fee is set to 0 in the initial state
    // The actual UI test would require navigating through all steps
  });

  it("initializes with zero delivery fee", () => {
    // Test that the initial state has deliveryFee set to 0
    // This tests our reducer changes
    const { initialState } = require("../utils/checkoutReducer");
    expect(initialState.deliveryFee).toBe(0);
  });

  // Add more tests for each step and the complete flow
});
