import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET endpoint to get orders with pending agreements
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const urgentOnly = searchParams.get("urgentOnly") === "true";
    const hoursThreshold = parseInt(searchParams.get("hoursThreshold") || "48");

    // Build query for pending agreements
    const query: any = {
      $or: [
        { agreementStatus: { $in: ["not_sent", "pending", "viewed"] } },
        { agreementStatus: { $exists: false } },
        { agreementStatus: null },
      ],
    };

    // If urgentOnly is true, filter by delivery date
    if (urgentOnly) {
      const urgentDate = new Date();
      urgentDate.setHours(urgentDate.getHours() + hoursThreshold);

      query.deliveryDate = {
        $lte: urgentDate,
        $gte: new Date(), // Only future deliveries
      };
    }

    // Find orders with pending agreements
    const orders = await Order.find(query)
      .select([
        "orderNumber",
        "customerName",
        "customerEmail",
        "deliveryDate",
        "eventDate",
        "agreementStatus",
        "agreementSentAt",
        "agreementViewedAt",
        "totalAmount",
        "status",
        "paymentStatus",
        "createdAt",
      ])
      .sort({ deliveryDate: 1, createdAt: -1 })
      .limit(100); // Limit to prevent large responses

    // Calculate urgency for each order
    const ordersWithUrgency = orders.map((order) => {
      const orderObj = order.toObject();
      let urgency = "low";
      let hoursUntilDelivery = null;

      if (orderObj.deliveryDate) {
        hoursUntilDelivery = Math.floor(
          (new Date(orderObj.deliveryDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60),
        );

        if (hoursUntilDelivery <= 24) {
          urgency = "critical";
        } else if (hoursUntilDelivery <= 48) {
          urgency = "urgent";
        } else if (hoursUntilDelivery <= 72) {
          urgency = "normal";
        }
      }

      return {
        ...orderObj,
        urgency,
        hoursUntilDelivery,
        needsAttention: urgency === "critical" || urgency === "urgent",
      };
    });

    // Group orders by urgency
    const groupedOrders = {
      critical: ordersWithUrgency.filter((o) => o.urgency === "critical"),
      urgent: ordersWithUrgency.filter((o) => o.urgency === "urgent"),
      normal: ordersWithUrgency.filter((o) => o.urgency === "normal"),
      low: ordersWithUrgency.filter((o) => o.urgency === "low"),
    };

    // Calculate summary statistics
    const summary = {
      total: orders.length,
      critical: groupedOrders.critical.length,
      urgent: groupedOrders.urgent.length,
      normal: groupedOrders.normal.length,
      low: groupedOrders.low.length,
      needsAttention:
        groupedOrders.critical.length + groupedOrders.urgent.length,
      notSent: orders.filter(
        (o) => !o.agreementStatus || o.agreementStatus === "not_sent",
      ).length,
      pending: orders.filter((o) => o.agreementStatus === "pending").length,
      viewed: orders.filter((o) => o.agreementStatus === "viewed").length,
    };

    return NextResponse.json({
      orders: urgentOnly
        ? [...groupedOrders.critical, ...groupedOrders.urgent]
        : ordersWithUrgency,
      grouped: groupedOrders,
      summary,
      filters: {
        urgentOnly,
        hoursThreshold,
      },
    });
  } catch (error: unknown) {
    console.error("Error getting pending agreements:", error);
    return NextResponse.json(
      {
        error: "Failed to get pending agreements",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
