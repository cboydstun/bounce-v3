import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { docusealService } from "@/services/docusealService";
import { agreementEmailService } from "@/services/agreementEmailService";
import type { DocuSealWebhookPayload } from "@/services/docusealService";

/**
 * POST endpoint to handle DocuSeal webhooks
 * This endpoint processes status updates from DocuSeal
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-docuseal-signature") || "";

    // Verify webhook signature (if configured)
    if (!docusealService.verifyWebhookSignature(body, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    let payload: DocuSealWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error("Invalid JSON payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const { event_type, data } = payload;
    const submission = data.submission;

    console.log(
      `Received DocuSeal webhook: ${event_type} for submission ${submission.id}`,
    );

    // Find the order associated with this submission
    const order = await Order.findOne({
      docusealSubmissionId: submission.id,
    });

    if (!order) {
      console.warn(`No order found for DocuSeal submission ${submission.id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Process different event types
    switch (event_type) {
      case "submission.viewed":
        await handleSubmissionViewed(order, submission);
        break;

      case "submission.completed":
        await handleSubmissionCompleted(order, submission);
        break;

      case "submission.declined":
        await handleSubmissionDeclined(order, submission);
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error processing DocuSeal webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle when a submission is viewed by the customer
 */
async function handleSubmissionViewed(order: any, submission: any) {
  try {
    // Update order status to indicate agreement was viewed
    await Order.findByIdAndUpdate(order._id, {
      agreementStatus: "viewed",
      agreementViewedAt: new Date(),
    });

    console.log(`Agreement viewed for order ${order.orderNumber}`);
  } catch (error) {
    console.error("Error handling submission viewed:", error);
  }
}

/**
 * Handle when a submission is completed (signed)
 */
async function handleSubmissionCompleted(order: any, submission: any) {
  try {
    // Get the signed document URL if available
    let signedDocumentUrl = null;
    if (submission.documents && submission.documents.length > 0) {
      signedDocumentUrl = submission.documents[0].url;
    }

    // Update order status to indicate agreement was signed
    await Order.findByIdAndUpdate(order._id, {
      agreementStatus: "signed",
      agreementSignedAt: new Date(),
      signedDocumentUrl: signedDocumentUrl,
      deliveryBlocked: false, // Unblock delivery now that agreement is signed
    });

    console.log(`Agreement signed for order ${order.orderNumber}`);

    // Send confirmation email to customer
    try {
      const orderForEmail = order.toObject();
      await agreementEmailService.sendAgreementSigned({
        ...orderForEmail,
        _id: String(orderForEmail._id),
      });
    } catch (emailError) {
      console.error("Error sending agreement signed email:", emailError);
      // Don't fail the webhook if email fails
    }

    // TODO: Notify admin/operations team that order is ready for delivery
    // This could be an email, SMS, or internal notification
  } catch (error) {
    console.error("Error handling submission completed:", error);
  }
}

/**
 * Handle when a submission is declined by the customer
 */
async function handleSubmissionDeclined(order: any, submission: any) {
  try {
    // Update order status to indicate agreement was declined
    await Order.findByIdAndUpdate(order._id, {
      agreementStatus: "not_sent", // Reset to allow resending
      deliveryBlocked: true, // Keep delivery blocked
    });

    console.log(`Agreement declined for order ${order.orderNumber}`);

    // TODO: Notify admin team that customer declined the agreement
    // This may require follow-up or order cancellation
  } catch (error) {
    console.error("Error handling submission declined:", error);
  }
}

/**
 * GET endpoint for webhook verification (if DocuSeal requires it)
 */
export async function GET(request: NextRequest) {
  // Some webhook services require a GET endpoint for verification
  const challenge = request.nextUrl.searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    message: "DocuSeal webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
