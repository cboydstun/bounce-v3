import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  docusealService,
  SubmissionNotFoundError,
} from "@/services/docusealService";
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

    // Check if order is cancelled or refunded
    if (order.status === "Cancelled" || order.status === "Refunded") {
      return NextResponse.json(
        { error: "Cannot send agreement to cancelled or refunded orders" },
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

    // Use the improved createOrGetSubmission method that handles 404 errors gracefully
    let submission;
    let signingUrl;

    try {
      const orderData = order.toObject();
      const orderForDocuSeal = {
        ...orderData,
        _id: String(orderData._id),
      };

      console.log(
        `Processing agreement for order ${orderId}, existing submission: ${order.docusealSubmissionId}`,
      );

      // Use the new method that handles existing submissions and 404 errors
      submission = await docusealService.createOrGetSubmission(
        orderForDocuSeal,
        order.docusealSubmissionId || undefined,
      );

      // Validate that we have a valid submission
      if (!submission || !submission.id) {
        throw new Error(
          "Failed to create or retrieve DocuSeal submission - no submission ID returned",
        );
      }

      console.log(
        `Got submission ${submission.id}, getting signing URL for ${order.customerEmail}`,
      );

      // Get the signing URL directly from the submission (no need for another API call)
      const submitter = submission.submitters.find(
        (s) => s.email === order.customerEmail,
      );

      if (!submitter) {
        throw new Error(
          `Submitter not found for customer email: ${order.customerEmail}`,
        );
      }

      if (!submitter.embed_src) {
        console.warn(
          `No embed_src found for submitter, attempting to create new submission`,
        );

        // If the existing submission doesn't have a valid signing URL, create a new one
        const orderData = order.toObject();
        const orderForDocuSeal = {
          ...orderData,
          _id: String(orderData._id),
        };

        const newSubmission =
          await docusealService.createSubmission(orderForDocuSeal);
        const newSubmitter = newSubmission.submitters.find(
          (s) => s.email === order.customerEmail,
        );

        if (!newSubmitter || !newSubmitter.embed_src) {
          throw new Error(
            `Failed to get signing URL even after creating new submission`,
          );
        }

        // Update the submission reference
        submission = newSubmission;
        signingUrl = newSubmitter.embed_src;
        console.log(
          `Created new submission ${newSubmission.id} with signing URL: ${signingUrl}`,
        );
      } else {
        signingUrl = submitter.embed_src;
        console.log(
          `Successfully got signing URL for submission ${submission.id}: ${signingUrl}`,
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
        if (error instanceof SubmissionNotFoundError) {
          console.warn(
            `Submission ${order.docusealSubmissionId} not found in DocuSeal, may have been deleted`,
          );
          // Optionally clean up the invalid submission ID from the order
          // await Order.findByIdAndUpdate(orderId, { $unset: { docusealSubmissionId: 1 } });
        } else {
          console.warn("Could not fetch submission status:", error);
        }
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
