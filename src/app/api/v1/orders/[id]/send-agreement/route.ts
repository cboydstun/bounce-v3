import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { docusealService } from "@/services/docusealService";
import { agreementEmailService } from "@/services/agreementEmailService";

/**
 * POST endpoint to send rental agreement for an order
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

    await dbConnect();

    const { id: orderId } = await params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if customer email exists
    if (!order.customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required to send agreement" },
        { status: 400 },
      );
    }

    // Check if agreement has already been signed
    if (order.agreementStatus === "signed") {
      return NextResponse.json(
        { error: "Agreement has already been signed" },
        { status: 400 },
      );
    }

    // If agreement was already sent and is pending, we can resend
    let submission;
    let signingUrl;

    try {
      if (order.docusealSubmissionId && order.agreementStatus === "pending") {
        // Try to get existing submission
        try {
          submission = await docusealService.getSubmissionStatus(
            order.docusealSubmissionId,
          );
          signingUrl = await docusealService.getSigningUrl(
            order.docusealSubmissionId,
            order.customerEmail,
          );
        } catch (error) {
          console.warn(
            "Existing submission not found, creating new one:",
            error,
          );
          // If existing submission is not found, create a new one
          const orderData = order.toObject();
          submission = await docusealService.createSubmission({
            ...orderData,
            _id: String(orderData._id),
          });
          signingUrl = await docusealService.getSigningUrl(
            submission.id,
            order.customerEmail,
          );
        }
      } else {
        // Create new submission
        const orderData = order.toObject();
        submission = await docusealService.createSubmission({
          ...orderData,
          _id: String(orderData._id),
        });
        signingUrl = await docusealService.getSigningUrl(
          submission.id,
          order.customerEmail,
        );
      }

      // Update order with submission details
      await Order.findByIdAndUpdate(orderId, {
        agreementStatus: "pending",
        agreementSentAt: new Date(),
        docusealSubmissionId: submission.id,
        deliveryBlocked: true, // Ensure delivery is blocked until signed
      });

      // Send email to customer
      const orderForEmail = order.toObject();
      await agreementEmailService.sendInitialAgreement(
        {
          ...orderForEmail,
          _id: String(orderForEmail._id),
        },
        signingUrl,
      );

      // Return success response
      return NextResponse.json({
        message: "Agreement sent successfully",
        submissionId: submission.id,
        status: "pending",
        sentAt: new Date().toISOString(),
      });
    } catch (docusealError) {
      console.error("DocuSeal error:", docusealError);
      return NextResponse.json(
        {
          error: "Failed to create or send agreement",
          details:
            docusealError instanceof Error
              ? docusealError.message
              : "Unknown DocuSeal error",
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error("Error sending agreement:", error);
    return NextResponse.json(
      {
        error: "Failed to send agreement",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check agreement status for an order
 * This endpoint is protected and requires authentication
 */
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
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    const { id: orderId } = await params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If there's a DocuSeal submission, get the latest status
    let submissionStatus = null;
    if (order.docusealSubmissionId) {
      try {
        submissionStatus = await docusealService.getSubmissionStatus(
          order.docusealSubmissionId,
        );
      } catch (error) {
        console.warn("Could not fetch submission status:", error);
      }
    }

    return NextResponse.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      agreementStatus: order.agreementStatus,
      agreementSentAt: order.agreementSentAt,
      agreementViewedAt: order.agreementViewedAt,
      agreementSignedAt: order.agreementSignedAt,
      deliveryBlocked: order.deliveryBlocked,
      docusealSubmissionId: order.docusealSubmissionId,
      submissionStatus: submissionStatus,
      customerEmail: order.customerEmail,
      deliveryDate: order.deliveryDate,
      eventDate: order.eventDate,
    });
  } catch (error: unknown) {
    console.error("Error getting agreement status:", error);
    return NextResponse.json(
      { error: "Failed to get agreement status" },
      { status: 500 },
    );
  }
}
