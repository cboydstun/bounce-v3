import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST endpoint to override delivery block for an order
 * This endpoint is protected and requires authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    // Check if user has admin role (you may need to adjust this based on your user model)
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    await dbConnect();

    const { id: orderId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Override reason is required" },
        { status: 400 },
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order to override delivery block
    await Order.findByIdAndUpdate(orderId, {
      deliveryBlocked: false,
      agreementOverrideReason: reason.trim(),
      agreementOverrideBy: session.user.id,
      agreementOverrideAt: new Date(),
    });

    console.log(
      `Delivery block overridden for order ${order.orderNumber} by ${session.user.email}: ${reason}`,
    );

    return NextResponse.json({
      message: "Delivery block overridden successfully",
      orderId: orderId,
      overrideReason: reason.trim(),
      overrideBy: session.user.email,
      overrideAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error overriding delivery block:", error);
    return NextResponse.json(
      {
        error: "Failed to override delivery block",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
