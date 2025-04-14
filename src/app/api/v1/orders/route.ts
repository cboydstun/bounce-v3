import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    // Date range filter for createdAt
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
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
