import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { parseDateCT, formatDateCT } from "@/utils/dateUtils";
import { sendEmail } from "@/utils/emailService";
import twilio from "twilio";
import {
  generateNewOrderEmailAdmin,
  generateNewOrderEmailCustomer,
} from "@/utils/orderEmailTemplates";

/**
 * GET endpoint to list all orders
 * This endpoint is protected and requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("paymentStatus");
    const contactId = url.searchParams.get("contactId");
    const orderNumber = url.searchParams.get("orderNumber");

    // Build query
    const query: Record<string, unknown> = {};

    // Date range filter for createdAt using Central Time
    if (startDate && endDate) {
      query.createdAt = {
        $gte: parseDateCT(startDate),
        $lte: parseDateCT(endDate),
      };
    } else if (startDate) {
      query.createdAt = { $gte: parseDateCT(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: parseDateCT(endDate) };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by contact ID
    if (contactId) {
      query.contactId = contactId;
    }

    // Filter by order number
    if (orderNumber) {
      query.orderNumber = orderNumber;
    }

    // Execute query with sorting by createdAt (newest first)
    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      orders,
    });
  } catch (error: unknown) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST endpoint to create a new order
 * This endpoint is public and does not require authentication
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const orderData = await request.json();

    // Validate required fields
    const requiredFields = ["items", "paymentMethod"];
    const missingFields = requiredFields.filter((field) => !orderData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate that either contactId or customerEmail is provided
    if (!orderData.contactId && !orderData.customerEmail) {
      return NextResponse.json(
        { error: "Either contactId or customer email must be provided" },
        { status: 400 },
      );
    }

    // If contactId is provided, check if an order already exists for this contact
    if (orderData.contactId) {
      const existingOrder = await Order.findOne({
        contactId: orderData.contactId,
      });
      if (existingOrder) {
        return NextResponse.json(
          { error: "An order already exists for this contact" },
          { status: 400 },
        );
      }
    }

    // Validate items array is not empty
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 },
      );
    }

    // Generate order number if not provided
    if (!orderData.orderNumber) {
      orderData.orderNumber = await Order.generateOrderNumber();
    }

    // Calculate subtotal if not provided
    if (!orderData.subtotal) {
      orderData.subtotal = orderData.items.reduce(
        (sum: number, item: any) => sum + (item.totalPrice || 0),
        0,
      );
    }

    // Set default delivery fee if not provided
    if (!orderData.deliveryFee && orderData.deliveryFee !== 0) {
      orderData.deliveryFee = 20; // Default $20
    }

    // Calculate processing fee if not provided (3% of subtotal)
    if (!orderData.processingFee && orderData.processingFee !== 0) {
      orderData.processingFee =
        Math.round(orderData.subtotal * 0.03 * 100) / 100;
    }

    // Calculate total amount if not provided
    if (!orderData.totalAmount) {
      orderData.totalAmount =
        Math.round(
          (orderData.subtotal +
            (orderData.taxAmount || 0) +
            orderData.deliveryFee +
            orderData.processingFee -
            (orderData.discountAmount || 0)) *
            100,
        ) / 100;
    }

    // Calculate balance due if not provided
    if (!orderData.balanceDue) {
      orderData.balanceDue =
        Math.round(
          (orderData.totalAmount - (orderData.depositAmount || 0)) * 100,
        ) / 100;
    }

    // Set default status values if not provided
    if (!orderData.status) {
      orderData.status = "Pending";
    }

    if (!orderData.paymentStatus) {
      orderData.paymentStatus = "Pending";
    }

    // Create order
    const order = await Order.create(orderData);

    // If order was created from a contact, update the contact status to "Converted"
    if (orderData.contactId) {
      await Contact.findByIdAndUpdate(orderData.contactId, {
        confirmed: "Converted",
      });
    }

    // Send email to admin
    try {
      await sendEmail({
        from: process.env.EMAIL as string,
        to: [
          process.env.OTHER_EMAIL as string,
          process.env.SECOND_EMAIL as string,
        ],
        subject: `New Order: ${order.orderNumber}`,
        text: generateNewOrderEmailAdmin(order),
      });
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
      // Continue execution even if email fails
    }

    // Send confirmation email to customer if email is provided
    if (order.customerEmail) {
      try {
        await sendEmail({
          from: process.env.EMAIL as string,
          to: order.customerEmail,
          subject: `Your Order Confirmation: ${order.orderNumber}`,
          text: generateNewOrderEmailCustomer(order),
        });
      } catch (emailError) {
        console.error("Error sending customer confirmation email:", emailError);
        // Continue execution even if email fails
      }
    }

    // Send SMS notification
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (accountSid && authToken) {
        const client = twilio(accountSid, authToken);

        // Format items for SMS
        const itemsList = order.items
          .map((item: any) => `${item.name} x${item.quantity}`)
          .join(", ");

        // Create SMS body with order details
        const smsBody = `
          New Order: ${order.orderNumber}
          Items: ${itemsList}
          Total: $${order.totalAmount}
          Customer: ${order.customerName || "N/A"}
          Email: ${order.customerEmail || "N/A"}
          Phone: ${order.customerPhone || "N/A"}
        `.trim();

        await client.messages.create({
          body: smsBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.USER_PHONE_NUMBER || "",
        });
      }
    } catch (smsError) {
      console.error("Error sending SMS notification:", smsError);
      // Continue execution even if SMS fails
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create order: ${error.message}` },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
