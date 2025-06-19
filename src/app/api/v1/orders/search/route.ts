import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to search orders" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status"); // Optional status filter
    const includeCompleted =
      url.searchParams.get("includeCompleted") === "true";

    // Build search query
    const searchQuery: any = {};

    // Status filter - by default exclude completed orders unless specifically requested
    if (status) {
      searchQuery.status = status;
    } else if (!includeCompleted) {
      searchQuery.status = { $ne: "Completed" };
    }

    // Text search across multiple fields
    if (query.trim()) {
      const searchRegex = new RegExp(query.trim(), "i");
      searchQuery.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
        { customerAddress: searchRegex },
        { customerCity: searchRegex },
      ];
    }

    // Execute search with projection to only return needed fields
    const orders = await Order.find(searchQuery)
      .select({
        _id: 1,
        orderNumber: 1,
        customerName: 1,
        customerEmail: 1,
        customerPhone: 1,
        customerAddress: 1,
        customerCity: 1,
        customerState: 1,
        customerZipCode: 1,
        eventDate: 1,
        deliveryDate: 1,
        status: 1,
        totalAmount: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit);

    // Format the response with computed fields for better UX
    const formattedOrders = orders.map((order) => {
      const fullAddress = [
        order.customerAddress,
        order.customerCity,
        order.customerState,
        order.customerZipCode,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        fullAddress,
        eventDate: order.eventDate,
        deliveryDate: order.deliveryDate,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        // Computed display fields for the dropdown
        displayText: `${order.orderNumber} - ${order.customerName || "No Name"}`,
        displaySubtext: `${fullAddress} • ${order.eventDate ? new Date(order.eventDate).toLocaleDateString() : "No Event Date"} • $${order.totalAmount || 0}`,
      };
    });

    return NextResponse.json({
      orders: formattedOrders,
      total: formattedOrders.length,
      hasMore: formattedOrders.length === limit,
    });
  } catch (error: unknown) {
    console.error("Error searching orders:", error);
    return NextResponse.json(
      { error: "Failed to search orders" },
      { status: 500 },
    );
  }
}
