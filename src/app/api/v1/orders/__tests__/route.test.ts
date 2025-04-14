import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { GET as GET_BY_ID, PUT, DELETE } from "../[id]/route";
import {
  POST as INITIATE_PAYMENT,
  PATCH as UPDATE_PAYMENT,
} from "../[id]/payment/route";
import * as dbHandler from "@/lib/test/db-handler";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Set environment variables for tests
process.env.JWT_SECRET = "test-secret";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Orders API", () => {
  let userToken: string;
  let adminToken: string;
  let contactId: string;
  let orderId: string;

  beforeEach(async () => {
    // Create regular user
    const user = await User.create({
      email: "user@example.com",
      password: "password123",
      name: "Regular User",
      role: "user",
    });

    userToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    // Create admin user
    const admin = await User.create({
      email: "admin@example.com",
      password: "password123",
      name: "Admin User",
      role: "admin",
    });

    adminToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    // Create test contact
    const contact = (await Contact.create({
      bouncer: "Test Bouncer",
      email: "test@example.com",
      partyDate: new Date("2025-05-15"),
      partyZipCode: "12345",
      sourcePage: "website",
    })) as mongoose.Document & { _id: mongoose.Types.ObjectId };
    contactId = contact._id.toString();

    // Create test order
    const order = (await Order.create({
      contactId,
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

  // Helper function to test authentication for list endpoint
  const testListAuthProtection = async () => {
    // Set global auth state to unauthenticated
    global.mockAuthState.authenticated = false;

    // Test without authentication
    const reqWithoutAuth = new NextRequest(
      `http://localhost:3000/api/v1/orders`,
    );
    const responseWithoutAuth = await GET(reqWithoutAuth);
    expect(responseWithoutAuth.status).toBe(401);
    const dataWithoutAuth = await responseWithoutAuth.json();
    expect(dataWithoutAuth.error).toContain("Unauthorized");

    // Set global auth state to authenticated
    global.mockAuthState.authenticated = true;
    global.mockAuthState.isAdmin = false;

    // Test with authentication
    const options: { headers: HeadersInit } = {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "X-Auth-Type": "nextauth",
      },
    };

    const reqWithAuth = new NextRequest(
      `http://localhost:3000/api/v1/orders`,
      options,
    );
    return { reqWithAuth };
  };

  // Helper function to test authentication for item endpoints
  const testItemAuthProtection = async (
    method: (
      req: NextRequest,
      params: { params: Promise<{ id: string }> },
    ) => Promise<Response>,
    id: string,
    requestBody?: object,
  ) => {
    // Create params object
    const params = {
      params: Promise.resolve({ id }),
    };

    // Set global auth state to unauthenticated
    global.mockAuthState.authenticated = false;

    // Test without authentication
    const reqWithoutAuth = new NextRequest(
      `http://localhost:3000/api/v1/orders/${id}`,
    );
    const responseWithoutAuth = await method(reqWithoutAuth, params);
    expect(responseWithoutAuth.status).toBe(401);
    const dataWithoutAuth = await responseWithoutAuth.json();
    expect(dataWithoutAuth.error).toContain("Not authorized");

    // Set global auth state to authenticated
    global.mockAuthState.authenticated = true;
    global.mockAuthState.isAdmin = false;

    // Test with authentication
    const options: { headers: HeadersInit; method?: string; body?: string } = {
      headers: {
        Authorization: `Bearer ${userToken}`,
        "X-Auth-Type": "nextauth",
      },
    };

    if (requestBody) {
      // Determine method based on the function being tested
      if (method === PUT) {
        options.method = "PUT";
      } else if (method === DELETE) {
        options.method = "DELETE";
      }
      options.body = JSON.stringify(requestBody);
    }

    const reqWithAuth = new NextRequest(
      `http://localhost:3000/api/v1/orders/${id}`,
      options,
    );
    return { reqWithAuth, method, params };
  };

  describe("GET /api/v1/orders", () => {
    it("should return 401 if user is not authenticated", async () => {
      // Set global auth state to unauthenticated
      global.mockAuthState.authenticated = false;

      const req = new NextRequest("http://localhost:3000/api/v1/orders");
      const response = await GET(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized - Not authenticated");
    });

    it("should return all orders for authenticated user", async () => {
      const { reqWithAuth } = await testListAuthProtection();

      const response = await GET(reqWithAuth);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].orderNumber).toBe("BB-2024-0001");
    });

    it("should filter orders by status", async () => {
      // Create another order with different status
      await Order.create({
        contactId,
        orderNumber: "BB-2024-0002",
        items: [
          {
            type: "bouncer",
            name: "Test Bouncer 2",
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
          },
        ],
        subtotal: 200,
        taxAmount: 16.5,
        discountAmount: 0,
        deliveryFee: 20,
        processingFee: 6,
        totalAmount: 242.5,
        depositAmount: 60,
        balanceDue: 182.5,
        status: "Paid",
        paymentStatus: "Paid",
        paymentMethod: "paypal",
      });

      // Ensure authentication is enabled
      global.mockAuthState.authenticated = true;
      global.mockAuthState.isAdmin = false;

      const req = new NextRequest(
        "http://localhost:3000/api/v1/orders?status=Paid",
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "X-Auth-Type": "nextauth",
          },
        },
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0].status).toBe("Paid");
      expect(data.orders[0].orderNumber).toBe("BB-2024-0002");
    });
  });

  describe("POST /api/v1/orders", () => {
    it("should return 400 if required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify({
          // Missing items and paymentMethod
          contactId,
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should return 400 if neither contactId nor customerEmail is provided", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify({
          // Missing contactId and customerEmail
          items: [
            {
              type: "bouncer",
              name: "Test Bouncer",
              quantity: 1,
              unitPrice: 150,
              totalPrice: 150,
            },
          ],
          paymentMethod: "paypal",
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe(
        "Either contactId or customer email must be provided",
      );
    });

    it("should create a new order with contactId", async () => {
      const orderData = {
        contactId,
        items: [
          {
            type: "bouncer",
            name: "New Bouncer",
            quantity: 1,
            unitPrice: 180,
            totalPrice: 180,
          },
        ],
        taxAmount: 14.85,
        discountAmount: 0,
        paymentMethod: "paypal",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.contactId.toString()).toBe(contactId);
      expect(data.items[0].name).toBe("New Bouncer");
      expect(data.subtotal).toBe(180);
      expect(data.deliveryFee).toBe(20); // Default value
      expect(data.processingFee).toBe(5.4); // 3% of subtotal
      expect(data.status).toBe("Pending");
      expect(data.paymentStatus).toBe("Pending");
      expect(data.orderNumber).toMatch(/^BB-\d{4}-\d{4}$/);
    });

    it("should create a new order with direct customer information", async () => {
      const orderData = {
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "123-456-7890",
        customerAddress: "123 Main St",
        customerCity: "San Antonio",
        customerState: "TX",
        customerZipCode: "78701",
        items: [
          {
            type: "bouncer",
            name: "Direct Order Bouncer",
            quantity: 1,
            unitPrice: 220,
            totalPrice: 220,
          },
        ],
        taxAmount: 18.15,
        discountAmount: 0,
        paymentMethod: "paypal",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.contactId).toBeUndefined();
      expect(data.customerName).toBe("John Doe");
      expect(data.customerEmail).toBe("john@example.com");
      expect(data.items[0].name).toBe("Direct Order Bouncer");
      expect(data.subtotal).toBe(220);
      expect(data.deliveryFee).toBe(20); // Default value
      expect(data.processingFee).toBe(6.6); // 3% of subtotal
      expect(data.status).toBe("Pending");
      expect(data.paymentStatus).toBe("Pending");
    });

    it("should update contact status to Converted when creating an order from contact", async () => {
      // Create a test contact with required fields for conversion
      const testContact = (await Contact.create({
        bouncer: "Conversion Test Bouncer",
        email: "conversion@example.com",
        partyDate: new Date("2025-06-15"),
        partyZipCode: "12345",
        sourcePage: "website",
        streetAddress: "123 Test St",
        partyStartTime: "14:00",
      })) as mongoose.Document & { _id: mongoose.Types.ObjectId };

      const orderData = {
        contactId: testContact._id.toString(),
        items: [
          {
            type: "bouncer",
            name: "Conversion Test Bouncer",
            quantity: 1,
            unitPrice: 180,
            totalPrice: 180,
          },
        ],
        taxAmount: 14.85,
        discountAmount: 0,
        paymentMethod: "paypal",
      };

      const req = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);

      // Verify the order was created
      const data = await response.json();
      expect(data.contactId.toString()).toBe(testContact._id.toString());

      // Verify the contact status was updated to "Converted"
      const updatedContact = await Contact.findById(testContact._id);
      expect(updatedContact?.confirmed).toBe("Converted");
    });

    it("should prevent creating duplicate orders for the same contact", async () => {
      // Create a test contact
      const testContact = (await Contact.create({
        bouncer: "Duplicate Test Bouncer",
        email: "duplicate@example.com",
        partyDate: new Date("2025-07-15"),
        partyZipCode: "12345",
        sourcePage: "website",
        streetAddress: "123 Test St",
        partyStartTime: "14:00",
      })) as mongoose.Document & { _id: mongoose.Types.ObjectId };

      // Create first order
      const orderData = {
        contactId: testContact._id.toString(),
        items: [
          {
            type: "bouncer",
            name: "Duplicate Test Bouncer",
            quantity: 1,
            unitPrice: 180,
            totalPrice: 180,
          },
        ],
        taxAmount: 14.85,
        discountAmount: 0,
        paymentMethod: "paypal",
      };

      const firstReq = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const firstResponse = await POST(firstReq);
      expect(firstResponse.status).toBe(201);

      // Attempt to create second order for the same contact
      const secondReq = new NextRequest("http://localhost:3000/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const secondResponse = await POST(secondReq);
      expect(secondResponse.status).toBe(400);

      const errorData = await secondResponse.json();
      expect(errorData.error).toContain(
        "An order already exists for this contact",
      );
    });
  });

  describe("GET /api/v1/orders/[id]", () => {
    it("should require authentication", async () => {
      await testItemAuthProtection(GET_BY_ID, orderId);
    });

    it("should return a specific order for authenticated user", async () => {
      const { reqWithAuth, method, params } = await testItemAuthProtection(
        GET_BY_ID,
        orderId,
      );

      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.orderNumber).toBe("BB-2024-0001");
      expect(data.items[0].name).toBe("Test Bouncer");
    });

    it("should return 404 if order not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const { reqWithAuth, method, params } = await testItemAuthProtection(
        GET_BY_ID,
        nonExistentId,
      );

      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Order not found");
    });
  });

  describe("PUT /api/v1/orders/[id]", () => {
    it("should require authentication", async () => {
      await testItemAuthProtection(PUT, orderId);
    });

    it("should update an order for authenticated user", async () => {
      const { reqWithAuth, method, params } = await testItemAuthProtection(
        PUT,
        orderId,
        {
          status: "Processing",
          notes: "Updated order notes",
        },
      );

      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("Processing");
      expect(data.notes).toBe("Updated order notes");
    });

    it("should prevent invalid status transitions", async () => {
      // First update to Refunded
      await Order.findByIdAndUpdate(orderId, { status: "Refunded" });

      const { reqWithAuth, method, params } = await testItemAuthProtection(
        PUT,
        orderId,
        {
          status: "Pending", // Invalid transition from Refunded to Pending
        },
      );

      const response = await method(reqWithAuth, params);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Invalid status transition");
    });
  });

  describe("DELETE /api/v1/orders/[id]", () => {
    it("should require admin authentication", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      // Set auth state to regular user
      global.mockAuthState.authenticated = true;
      global.mockAuthState.isAdmin = false;

      // Test with regular user
      const reqWithUser = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "X-Auth-Type": "nextauth",
          },
        },
      );

      const responseWithUser = await DELETE(reqWithUser, params);
      expect(responseWithUser.status).toBe(401);
      const dataWithUser = await responseWithUser.json();
      expect(dataWithUser.error).toContain("Not authorized to delete orders");

      // Set auth state to admin user
      global.mockAuthState.authenticated = true;
      global.mockAuthState.isAdmin = true;

      // Test with admin user
      const reqWithAdmin = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "X-Auth-Type": "nextauth",
          },
        },
      );

      const responseWithAdmin = await DELETE(reqWithAdmin, params);
      expect(responseWithAdmin.status).toBe(200);
      const dataWithAdmin = await responseWithAdmin.json();
      expect(dataWithAdmin.message).toBe("Order deleted successfully");

      // Verify order was deleted
      const deletedOrder = await Order.findById(orderId);
      expect(deletedOrder).toBeNull();
    });

    it("should prevent deletion of Paid or Confirmed orders", async () => {
      // Update order to Paid status
      await Order.findByIdAndUpdate(orderId, { status: "Paid" });

      // Set auth state to admin user
      global.mockAuthState.authenticated = true;
      global.mockAuthState.isAdmin = true;

      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const reqWithAdmin = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "X-Auth-Type": "nextauth",
          },
        },
      );

      const response = await DELETE(reqWithAdmin, params);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe(
        "Cannot delete orders with Paid or Confirmed status",
      );
    });
  });

  describe("Payment Endpoints", () => {
    it("should initiate a payment for an order", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 186.88, // Full payment amount
          }),
        },
      );

      const response = await INITIATE_PAYMENT(req, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.paypalOrderId).toBeDefined();
      expect(data.amount).toBe(186.88);
      expect(data.currency).toBe("USD");
      expect(data.orderNumber).toBe("BB-2024-0001");
    });

    it("should reject payment with invalid amount", async () => {
      const params = {
        params: Promise.resolve({ id: orderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: 100, // Invalid amount (not matching total or deposit)
          }),
        },
      );

      const response = await INITIATE_PAYMENT(req, params);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Payment amount must match");
    });

    it("should update order with payment transaction details", async () => {
      // Create a fresh order for this test to avoid interference from other tests
      const freshOrder = (await Order.create({
        contactId,
        orderNumber: "BB-2024-9999",
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

      const freshOrderId = freshOrder._id.toString();
      const params = {
        params: Promise.resolve({ id: freshOrderId }),
      };

      const req = new NextRequest(
        `http://localhost:3000/api/v1/orders/${freshOrderId}/payment`,
        {
          method: "PATCH",
          body: JSON.stringify({
            transactionId: "PAY-123456789",
            payerId: "PAYER-123",
            payerEmail: "customer@example.com",
            amount: 186.88, // Full payment
            currency: "USD",
            status: "COMPLETED",
          }),
        },
      );

      const response = await UPDATE_PAYMENT(req, params);
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

    it("should handle partial payment (deposit)", async () => {
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

      const response = await UPDATE_PAYMENT(req, params);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.order.paymentStatus).toBe("Authorized");
      expect(data.order.status).toBe("Pending"); // Status remains Pending
      expect(data.order.balanceDue).toBe(136.88); // Total - deposit
    });
  });
});
