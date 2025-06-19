import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { docusealService } from "@/services/docusealService";

/**
 * POST endpoint to sync all orders with DocuSeal submission IDs
 * This endpoint is protected and requires authentication
 */
export async function POST(request: NextRequest) {
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

    console.log("Batch sync all agreements requested");

    // Find all orders that have DocuSeal submission IDs
    const ordersWithSubmissions = await Order.find({
      docusealSubmissionId: { $exists: true, $ne: null, $nin: ["", null] },
    }).select(
      "_id orderNumber docusealSubmissionId agreementStatus customerEmail",
    );

    if (ordersWithSubmissions.length === 0) {
      return NextResponse.json({
        message: "No orders found with DocuSeal submissions",
        results: {
          total: 0,
          updated: 0,
          alreadyCurrent: 0,
          failed: 0,
          errors: [],
        },
      });
    }

    console.log(
      `Found ${ordersWithSubmissions.length} orders with DocuSeal submissions`,
    );

    const syncResults = {
      total: ordersWithSubmissions.length,
      updated: 0,
      alreadyCurrent: 0,
      failed: 0,
      errors: [] as Array<{ orderNumber: string; error: string }>,
    };

    // Process each order
    for (const order of ordersWithSubmissions) {
      try {
        const orderId = String(order._id);
        console.log(`Syncing order ${order.orderNumber} (${orderId})`);

        const syncResult =
          await docusealService.syncOrderWithSubmission(orderId);

        if (syncResult.updated) {
          syncResults.updated++;
          console.log(`✅ Updated ${order.orderNumber}: ${syncResult.status}`);
        } else {
          syncResults.alreadyCurrent++;
          console.log(
            `ℹ️ Already current ${order.orderNumber}: ${syncResult.status}`,
          );
        }
      } catch (error) {
        syncResults.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        syncResults.errors.push({
          orderNumber: order.orderNumber,
          error: errorMessage,
        });
        console.error(`❌ Failed to sync ${order.orderNumber}:`, errorMessage);
      }
    }

    console.log(
      `Batch sync completed: ${syncResults.updated} updated, ${syncResults.alreadyCurrent} current, ${syncResults.failed} failed`,
    );

    return NextResponse.json({
      message: "Batch sync completed",
      results: syncResults,
    });
  } catch (error: unknown) {
    console.error("Error in batch sync:", error);
    return NextResponse.json(
      {
        error: "Failed to sync agreements",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
