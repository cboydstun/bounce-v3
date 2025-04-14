import Order from "../Order";
import Contact from "../Contact";
import * as dbHandler from "../../lib/test/db-handler";
import mongoose from "mongoose";

// Connect to a test database before running any tests
beforeAll(async () => await dbHandler.connect());

// Clear all test data after every test
afterEach(async () => await dbHandler.clearDatabase());

// Close database connection after all tests
afterAll(async () => await dbHandler.closeDatabase());

describe("Order Model", () => {
  let contactId: mongoose.Types.ObjectId;

  // Create a test contact before each test
  beforeEach(async () => {
    const contact = await Contact.create({
      bouncer: "Test Bouncer",
      email: "test@example.com",
      partyDate: new Date("2025-05-15"),
      partyZipCode: "12345",
      sourcePage: "website",
    }) as mongoose.Document & { _id: mongoose.Types.ObjectId };
    contactId = contact._id;
  });

  it("should create a valid order", async () => {
    const orderData = {
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
      processingFee: 4.5, // 3% of subtotal
      totalAmount: 186.88, // 150 + 12.38 + 20 + 4.5 = 186.88
      depositAmount: 50,
      balanceDue: 136.88,
      paymentMethod: "paypal",
    };

    const order = await Order.create(orderData);
    expect(order._id).toBeDefined();
    expect(order.orderNumber).toBe("BB-2024-0001");
    expect(order.status).toBe("Pending"); // Default value
    expect(order.paymentStatus).toBe("Pending"); // Default value
    expect(order.items).toHaveLength(1);
    expect(order.items[0].name).toBe("Test Bouncer");
    expect(order.deliveryFee).toBe(20); // Default delivery fee
    expect(order.processingFee).toBe(4.5); // 3% of subtotal
  });

  it("should fail validation if required fields are missing", async () => {
    const invalidOrder = {
      contactId,
      // Missing orderNumber
      items: [
        {
          type: "bouncer",
          name: "Test Bouncer",
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
        },
      ],
      // Missing subtotal
      taxAmount: 12.38,
      discountAmount: 0,
      // Missing deliveryFee
      // Missing processingFee
      // Missing totalAmount
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow();
  });

  it("should create a valid order with direct customer information (no contactId)", async () => {
    const orderData = {
      // No contactId
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "123-456-7890",
      customerAddress: "123 Main St",
      customerCity: "Austin",
      customerState: "TX",
      customerZipCode: "78701",
      orderNumber: "BB-2024-0010",
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
      processingFee: 4.5, // 3% of subtotal
      totalAmount: 186.88, // 150 + 12.38 + 20 + 4.5 = 186.88
      depositAmount: 50,
      balanceDue: 136.88,
      paymentMethod: "paypal",
    };

    const order = await Order.create(orderData);
    expect(order._id).toBeDefined();
    expect(order.orderNumber).toBe("BB-2024-0010");
    expect(order.contactId).toBeUndefined();
    expect(order.customerName).toBe("John Doe");
    expect(order.customerEmail).toBe("john@example.com");
    expect(order.customerZipCode).toBe("78701");
  });

  it("should fail validation if neither contactId nor customer email is provided", async () => {
    const invalidOrder = {
      // No contactId
      // No customerEmail
      customerName: "John Doe",
      orderNumber: "BB-2024-0011",
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
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/Either contactId or customer email must be provided/);
  });

  it("should fail validation if items array is empty", async () => {
    const invalidOrder = {
      contactId,
      orderNumber: "BB-2024-0002",
      items: [], // Empty items array
      subtotal: 150,
      taxAmount: 12.38,
      discountAmount: 0,
      totalAmount: 162.38,
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/at least one item/);
  });

  it("should fail validation if monetary values are negative", async () => {
    const invalidOrder = {
      contactId,
      orderNumber: "BB-2024-0003",
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
      deliveryFee: -5, // Negative value
      processingFee: 4.5,
      totalAmount: 162.38,
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/min/);
  });

  it("should fail validation with invalid payment method", async () => {
    const invalidOrder = {
      contactId,
      orderNumber: "BB-2024-0004",
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
      totalAmount: 162.38,
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "invalid-method", // Invalid payment method
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/enum/);
  });

  it("should fail validation with invalid item type", async () => {
    const invalidOrder = {
      contactId,
      orderNumber: "BB-2024-0005",
      items: [
        {
          type: "invalid-type", // Invalid item type
          name: "Test Bouncer",
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
        },
      ],
      subtotal: 150,
      taxAmount: 12.38,
      discountAmount: 0,
      totalAmount: 162.38,
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/enum/);
  });

  it("should validate PayPal transaction details", async () => {
    const orderData = {
      contactId,
      orderNumber: "BB-2024-0006",
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
      totalAmount: 162.38,
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "paypal",
      paypalTransactions: [
        {
          transactionId: "PAY-123456789",
          payerId: "PAYER-123",
          payerEmail: "customer@example.com",
          amount: 50,
          currency: "USD",
          status: "COMPLETED",
        },
      ],
    };

    const order = await Order.create(orderData);
    expect(order.paypalTransactions).toHaveLength(1);
    expect(order.paypalTransactions?.[0]?.transactionId).toBe("PAY-123456789");
  });

  it("should fail validation with invalid PayPal transaction", async () => {
    const invalidOrder = {
      contactId,
      orderNumber: "BB-2024-0007",
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
      totalAmount: 162.38,
      depositAmount: 50,
      balanceDue: 112.38,
      paymentMethod: "paypal",
      paypalTransactions: [
        {
          // Missing required transactionId
          payerId: "PAYER-123",
          payerEmail: "customer@example.com",
          // Missing required amount
          currency: "USD",
          // Missing required status
        },
      ],
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow();
  });

  describe("Static Methods", () => {
    beforeEach(async () => {
      // Create test orders
      await Order.create([
        {
          contactId,
          orderNumber: "BB-2024-0001",
          items: [
            {
              type: "bouncer",
              name: "Bounce House 1",
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
          status: "Confirmed",
          paymentStatus: "Paid",
          paymentMethod: "paypal",
          tasks: ["Deliver", "Setup", "Pickup"],
          createdAt: new Date("2024-04-01"),
        },
        {
          contactId,
          orderNumber: "BB-2024-0002",
          items: [
            {
              type: "bouncer",
              name: "Bounce House 2",
              quantity: 1,
              unitPrice: 200,
              totalPrice: 200,
            },
            {
              type: "extra",
              name: "Generator",
              quantity: 1,
              unitPrice: 50,
              totalPrice: 50,
            },
          ],
          subtotal: 250,
          taxAmount: 20.63,
          discountAmount: 25,
          deliveryFee: 20,
          processingFee: 7.5, // 3% of 250
          totalAmount: 273.13, // 250 + 20.63 + 20 + 7.5 - 25 = 273.13
          depositAmount: 75,
          balanceDue: 198.13,
          status: "Pending",
          paymentStatus: "Pending",
          paymentMethod: "paypal",
          createdAt: new Date("2024-04-15"),
        },
      ]);
    });

  it("should use default values for deliveryFee and processingFee if not provided", async () => {
    const orderData = {
      contactId,
      orderNumber: "BB-2024-0008",
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
      // deliveryFee not provided - should default to 20
      // processingFee not provided - should be calculated as 3% of subtotal
      totalAmount: 186.88, // 150 + 12.38 + 20 + 4.5 = 186.88
      depositAmount: 50,
      balanceDue: 136.88,
      paymentMethod: "paypal",
    };

    const order = await Order.create(orderData);
    expect(order.deliveryFee).toBe(20); // Default value
    expect(order.processingFee).toBe(4.5); // Calculated as 3% of subtotal
  });

  it("should store tasks associated with the order", async () => {
    const orderData = {
      contactId,
      orderNumber: "BB-2024-0009",
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
      paymentMethod: "paypal",
      tasks: ["Deliver", "Setup", "Pickup"],
    };

    const order = await Order.create(orderData);
    expect(order.tasks).toHaveLength(3);
    expect(order.tasks).toContain("Deliver");
    expect(order.tasks).toContain("Setup");
    expect(order.tasks).toContain("Pickup");
  });

  it("should validate customer email format", async () => {
    const invalidOrder = {
      // No contactId
      customerName: "John Doe",
      customerEmail: "invalid-email", // Invalid email format
      orderNumber: "BB-2024-0012",
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
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/valid email/);
  });

  it("should validate customer phone format", async () => {
    const invalidOrder = {
      // No contactId
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "123", // Too short for phone regex
      orderNumber: "BB-2024-0013",
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
      paymentMethod: "paypal",
    };

    await expect(Order.create(invalidOrder)).rejects.toThrow(/valid phone/);
  });

    it("should find order by order number", async () => {
      const order = await Order.findByOrderNumber("BB-2024-0001");
      expect(order).toBeDefined();
      expect(order?.items[0].name).toBe("Bounce House 1");
    });

    it("should find orders by contact ID", async () => {
      const orders = await Order.findByContactId(contactId.toString());
      expect(orders).toHaveLength(2);
    });

    it("should find orders by status", async () => {
      const confirmedOrders = await Order.findByStatus("Confirmed");
      expect(confirmedOrders).toHaveLength(1);
      expect(confirmedOrders[0].orderNumber).toBe("BB-2024-0001");

      const pendingOrders = await Order.findByStatus("Pending");
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].orderNumber).toBe("BB-2024-0002");
    });

    it("should find orders by date range", async () => {
      const orders = await Order.findByDateRange(
        "2024-04-01",
        "2024-04-10"
      );
      expect(orders).toHaveLength(1);
      expect(orders[0].orderNumber).toBe("BB-2024-0001");
    });

    it("should generate a unique order number", async () => {
      // Create orders with specific order numbers to test sequence generation
      await Order.create({
        contactId,
        orderNumber: `BB-${new Date().getFullYear()}-0001`,
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
        paymentMethod: "paypal",
      });

      await Order.create({
        contactId,
        orderNumber: `BB-${new Date().getFullYear()}-0002`,
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
        paymentMethod: "paypal",
      });

      // Now generate a new order number
      const orderNumber = await Order.generateOrderNumber();
      expect(orderNumber).toMatch(/^BB-\d{4}-\d{4}$/);
      
      // The generated number should be higher than existing ones
      const numericPart = parseInt(orderNumber.split('-')[2]);
      expect(numericPart).toBeGreaterThan(2); // We already have 0001 and 0002
    });
  });
});
