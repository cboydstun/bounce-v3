import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import OrderDetailPage from "../page";
import { getOrderById } from "@/utils/api";

// Mock the Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock API functions
jest.mock("@/utils/api", () => ({
  getOrderById: jest.fn(),
}));

describe("OrderDetailPage", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  };

  const mockSession = {
    data: {
      user: { id: "user-123", name: "Test User", email: "test@example.com" },
    },
    status: "authenticated",
  };

  const mockOrder = {
    _id: "order-123",
    orderNumber: "BB-2024-0001",
    contactId: "contact-123",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "123-456-7890",
    items: [
      {
        type: "bouncer",
        name: "Castle Bounce House",
        quantity: 1,
        unitPrice: 150,
        totalPrice: 150,
      },
    ],
    subtotal: 150,
    taxAmount: 12.38,
    discountAmount: 0,
    deliveryFee: 20,
    processingFee: 4.5,
    totalAmount: 186.88,
    depositAmount: 50,
    balanceDue: 136.88,
    status: "Pending",
    paymentStatus: "Pending",
    paymentMethod: "paypal",
    notes: "Test notes",
    tasks: ["Delivery", "Setup"],
    createdAt: new Date("2024-04-14T15:00:00.000Z"),
    updatedAt: new Date("2024-04-14T15:00:00.000Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (getOrderById as jest.Mock).mockResolvedValue(mockOrder);
  });

  it("redirects to login if not authenticated", async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<OrderDetailPage params={{ id: "order-123" }} />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  it("shows loading state initially", () => {
    render(<OrderDetailPage params={{ id: "order-123" }} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("fetches and displays order details", async () => {
    render(<OrderDetailPage params={{ id: "order-123" }} />);

    await waitFor(() => {
      expect(getOrderById).toHaveBeenCalledWith("order-123");
    });

    await waitFor(() => {
      expect(screen.getByText("Order: BB-2024-0001")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Castle Bounce House")).toBeInTheDocument();
      expect(screen.getByText("$186.88")).toBeInTheDocument();
      expect(screen.getAllByText("Pending")[0]).toBeInTheDocument();
      expect(screen.getByText("Test notes")).toBeInTheDocument();
      expect(screen.getByText("Delivery")).toBeInTheDocument();
      expect(screen.getByText("Setup")).toBeInTheDocument();
    });
  });

  it("displays error message when order fetch fails", async () => {
    const errorMessage = "Failed to fetch order";
    (getOrderById as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<OrderDetailPage params={{ id: "order-123" }} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("navigates to edit page when edit button is clicked", async () => {
    render(<OrderDetailPage params={{ id: "order-123" }} />);

    await waitFor(() => {
      expect(screen.getAllByText("Edit Order")[0]).toBeInTheDocument();
    });

    const editButton = screen.getAllByText("Edit Order")[0];
    // In a real app, clicking a Next.js Link would navigate to the href
    // But in tests, we can't test this directly
    // So we just verify the link has the correct href
    expect(editButton.closest("a")).toHaveAttribute(
      "href",
      "/admin/orders/order-123/edit",
    );
  });

  it("navigates back to orders list when back button is clicked", async () => {
    render(<OrderDetailPage params={{ id: "order-123" }} />);

    await waitFor(() => {
      expect(screen.getByText("← Back to Orders")).toBeInTheDocument();
    });

    const backButton = screen.getByText("← Back to Orders");
    // In a real app, clicking a Next.js Link would navigate to the href
    // But in tests, we can't test this directly
    // So we just verify the link has the correct href
    expect(backButton.closest("a")).toHaveAttribute("href", "/admin/orders");
  });
});
