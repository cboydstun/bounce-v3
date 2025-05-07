import { NextRequest } from "next/server";
import { POST, PATCH } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Order from "@/models/Order";
import mongoose from "mongoose";

// Mock @sendgrid/mail
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue(true),
}));

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Payment API", () => {
  let orderId: string;

  beforeEach(async () => {
    // Create a test order
    const order = (await Order.create({
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "(123)-456-7890",
      customerAddress: "123 Test St",
      customerCity: "Test City",
      customerState: "TX",
      customerZipCode: "12345",
      orderNumber: "BB-2024-0001",
      items: [
        {
          type: "bouncer",
          name: "Test Bouncer",
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
    })) as mongoose.Document & { _id: mongoose.Types.ObjectId };

    orderId = order._id.toString();
  });

  describe("POST /api/v1/orders/[id]/payment", () => {
    it("should return 400 if order ID is invalid", async () => {
      const params = {
        params: Promise.resolve({ id: "invalid-id" }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/invalid-id/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 186.88,
          }),
        },
      );

      const response = await POST(req, params);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Invalid order ID format");
    });

    it("should return 404 if order is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const params = {
        params: Promise.resolve({ id: nonExistentId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${nonExistentId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 186.88,
          }),
        },
      );

      const response = await POST(req, params);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Order not found");
    });

    it("should return 400 if amount is not provided", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      const response = await POST(req, params);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Payment amount is required");
    });

    it("should return 400 if amount does not match total or deposit", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 100, // Neither total (186.88) nor deposit (50)
          }),
        },
      );

      const response = await POST(req, params);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Payment amount must match");
    });

    it("should initiate payment for full amount", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 186.88, // Full amount
          }),
        },
      );

      const response = await POST(req, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.paypalOrderId).toBeDefined();
      expect(data.amount).toBe(186.88);
      expect(data.currency).toBe("USD");
      expect(data.orderNumber).toBe("BB-2024-0001");
    });

    it("should initiate payment for deposit amount", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 50, // Deposit amount
          }),
        },
      );

      const response = await POST(req, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.paypalOrderId).toBeDefined();
      expect(data.amount).toBe(50);
      expect(data.currency).toBe("USD");
      expect(data.orderNumber).toBe("BB-2024-0001");
    });
  });

  describe("PATCH /api/v1/orders/[id]/payment", () => {
    it("should return 400 if required fields are missing", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "PATCH",
          body: JSON.stringify({
            // Missing required fields
          }),
        },
      );

      const response = await PATCH(req, params);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should record full payment and update order status", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "PATCH",
          body: JSON.stringify({
            transactionId: "PAY-123456789",
            payerId: "PAYER-123",
            payerEmail: "customer@example.com",
            amount: 186.88, // Full amount
            currency: "USD",
            status: "COMPLETED",
          }),
        },
      );

      const response = await PATCH(req, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe("Payment transaction recorded successfully");
      expect(data.order.paymentStatus).toBe("Paid");
      expect(data.order.status).toBe("Paid");
      expect(data.order.balanceDue).toBe(0);
      expect(data.order.paypalTransactions).toHaveLength(1);
      expect(data.order.paypalTransactions[0].transactionId).toBe(
        "PAY-123456789",
      );
    });

    it("should record deposit payment and update payment status", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "PATCH",
          body: JSON.stringify({
            transactionId: "PAY-123456789",
            payerId: "PAYER-123",
            payerEmail: "customer@example.com",
            amount: 50, // Deposit amount
            currency: "USD",
            status: "COMPLETED",
          }),
        },
      );

      const response = await PATCH(req, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe("Payment transaction recorded successfully");
      expect(data.order.paymentStatus).toBe("Authorized");
      expect(data.order.status).toBe("Pending"); // Status remains Pending
      expect(data.order.balanceDue).toBe(136.88); // Total - deposit
      expect(data.order.paypalTransactions).toHaveLength(1);
      expect(data.order.paypalTransactions[0].transactionId).toBe(
        "PAY-123456789",
      );
    });
  });
});
