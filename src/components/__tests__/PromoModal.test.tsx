import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import PromoModal from "../PromoModal";
import { Holiday } from "../../types/promo";

// Mock the getCurrentPromotion function
jest.mock("../../utils/promoUtils", () => ({
  getCurrentPromotion: jest.fn().mockImplementation((holidays) => holidays[0]),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe("PromoModal", () => {
  const mockHolidays: Holiday[] = [
    {
      name: "Test Holiday",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      message: "Test promotional message",
      promoTitle: "Test Holiday Special Offer",
      promoDescription: "Detailed description of the test holiday promotion",
      promoImage: "https://example.com/test-image.gif",
    },
  ];

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it("should not show modal initially", () => {
    render(<PromoModal holidays={mockHolidays} delayInSeconds={10} />);
    expect(screen.queryByText("Test Holiday Special Offer")).not.toBeInTheDocument();
  });

  it("should show modal after delay when not previously dismissed", () => {
    render(<PromoModal holidays={mockHolidays} delayInSeconds={10} />);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Test Holiday Special Offer")).toBeInTheDocument();
    expect(screen.getByText("Test promotional message")).toBeInTheDocument();
    expect(screen.getByText("Detailed description of the test holiday promotion")).toBeInTheDocument();
    expect(screen.getByAltText("Test Holiday Special Offer")).toBeInTheDocument();
  });

  it("should not show modal if previously dismissed within persistence period", () => {
    // Set localStorage to simulate a recent dismissal
    const storageKey = "promo_modal_test_holiday";
    const oneDayAgo = Date.now() - 12 * 60 * 60 * 1000; // 12 hours ago
    localStorageMock.setItem(storageKey, oneDayAgo.toString());

    render(
      <PromoModal
        holidays={mockHolidays}
        delayInSeconds={10}
        persistenceDays={1}
      />,
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Modal should not appear
    expect(screen.queryByText("Test Holiday Special Offer")).not.toBeInTheDocument();
  });

  it("should show modal if dismissal period has expired", () => {
    // Set localStorage to simulate a dismissal outside the persistence period
    const storageKey = "promo_modal_test_holiday";
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
    localStorageMock.setItem(storageKey, twoDaysAgo.toString());

    render(
      <PromoModal
        holidays={mockHolidays}
        delayInSeconds={10}
        persistenceDays={1}
      />,
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Modal should appear again
    expect(screen.getByText("Test Holiday Special Offer")).toBeInTheDocument();
  });

  it("should update localStorage when modal is closed", () => {
    render(<PromoModal holidays={mockHolidays} delayInSeconds={10} />);

    // Fast-forward time to show modal
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Click the close button
    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    // Fast-forward animation time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Check if localStorage was updated
    const storageKey = "promo_modal_test_holiday";
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      storageKey,
      expect.any(String),
    );
  });
});
