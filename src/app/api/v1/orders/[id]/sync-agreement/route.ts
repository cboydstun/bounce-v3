import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { docusealService } from "@/services/docusealService";

/**
 * POST endpoint to manually sync agreement status with DocuSeal
 * This endpoint is protected and requires authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: orderId } = await params;

    console.log(`Manual sync requested for order ${orderId}`);

    // Sync the order status with DocuSeal
    const result = await docusealService.syncOrderWithSubmission(orderId);

    return NextResponse.json({
      message: "Sync completed",
      updated: result.updated,
      status: result.status,
      orderId: orderId,
    });
  } catch (error: unknown) {
    console.error("Error syncing agreement status:", error);
    return NextResponse.json(
      {
        error: "Failed to sync agreement status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
