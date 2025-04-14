import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to view orders" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const order = await Order.findById(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to update orders" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    const orderData = await request.json();

    // Find the order document and update it manually
    const orderDoc = await Order.findById(resolvedParams.id);

    if (!orderDoc) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Special handling for status changes
    if (orderData.status) {
      // Validate status transitions
      const currentStatus = orderDoc.status;
      const newStatus = orderData.status;

      // Prevent certain status transitions
      // For example, can't go from "Refunded" to "Pending"
      if (currentStatus === "Refunded" && newStatus === "Pending") {
        return NextResponse.json(
          { error: "Invalid status transition" },
          { status: 400 },
        );
      }

      // Prevent changing to "Paid" if payment status is not "Paid"
      if (
        newStatus === "Paid" &&
        orderDoc.paymentStatus !== "Paid" &&
        orderData.paymentStatus !== "Paid"
      ) {
        return NextResponse.json(
          {
            error: "Cannot set order status to Paid when payment status is not Paid",
          },
          { status: 400 },
        );
      }
    }

    // Update all fields from orderData
    Object.keys(orderData).forEach((key) => {
      // For all fields, update directly
      (orderDoc as any)[key] = orderData[key];
    });

    // Recalculate derived values if necessary
    if (
      orderData.items ||
      orderData.taxAmount !== undefined ||
      orderData.discountAmount !== undefined ||
      orderData.deliveryFee !== undefined ||
      orderData.processingFee !== undefined ||
      orderData.depositAmount !== undefined
    ) {
      // Calculate subtotal if items were updated
      if (orderData.items) {
        orderDoc.subtotal = orderData.items.reduce(
          (sum: number, item: any) => sum + (item.totalPrice || 0),
          0,
        );
        
        // Recalculate processing fee if it's based on subtotal
        if (orderData.processingFee === undefined) {
          orderDoc.processingFee = Math.round(orderDoc.subtotal * 0.03 * 100) / 100;
        }
      }

      // Recalculate total amount
      orderDoc.totalAmount = Math.round(
        (orderDoc.subtotal +
          orderDoc.taxAmount +
          orderDoc.deliveryFee +
          orderDoc.processingFee -
          orderDoc.discountAmount) *
          100,
      ) / 100;

      // Recalculate balance due
      orderDoc.balanceDue = Math.round(
        (orderDoc.totalAmount - orderDoc.depositAmount) * 100,
      ) / 100;
    }

    // Save the updated document
    const updatedOrder = await orderDoc.save();

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error("Error updating order:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update order: ${error.message}` },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to delete orders" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Resolve the params promise
    const resolvedParams = await params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    // Find the order
    const order = await Order.findById(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Prevent deletion of orders with certain statuses
    if (order.status === "Paid" || order.status === "Confirmed") {
      return NextResponse.json(
        { error: "Cannot delete orders with Paid or Confirmed status" },
        { status: 400 },
      );
    }

    // Delete order
    await Order.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 },
    );
  }
}
