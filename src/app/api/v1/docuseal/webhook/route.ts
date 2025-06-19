import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { docusealService } from "@/services/docusealService";
import { agreementEmailService } from "@/services/agreementEmailService";

/**
 * DocuSeal webhook endpoint
 * Handles events from DocuSeal when submissions are created, completed, etc.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-docuseal-signature") || "";

    // Verify webhook signature
    if (!docusealService.verifyWebhookSignature(body, signature)) {
      console.error("Invalid DocuSeal webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);
    console.log("DocuSeal webhook received:", JSON.stringify(payload, null, 2));

    const { event_type, timestamp, data } = payload;

    // Handle different event types
    switch (event_type) {
      case "submission.completed":
        await handleSubmissionCompleted(data);
        break;

      case "submission.viewed":
        await handleSubmissionViewed(data);
        break;

      case "submission.declined":
        await handleSubmissionDeclined(data);
        break;

      case "submission.created":
        console.log(`Submission ${data.id} created`);
        break;

      default:
        console.log(`Unhandled DocuSeal event: ${event_type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing DocuSeal webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

/**
 * Handle submission completed event
 */
async function handleSubmissionCompleted(submissionData: any) {
  try {
    const submissionId = submissionData.id;
    const completedAt = submissionData.completed_at;

    console.log(`Processing completed submission ${submissionId}`);

    // Find the order with this submission ID
    const order = await Order.findOne({
      docusealSubmissionId: String(submissionId),
    });

    if (!order) {
      console.warn(`No order found for submission ${submissionId}`);
      return;
    }

    console.log(
      `Found order ${order.orderNumber} for submission ${submissionId}`,
    );

    // Update order status
    await Order.findByIdAndUpdate(order._id, {
      agreementStatus: "signed",
      agreementSignedAt: new Date(completedAt),
      deliveryBlocked: false, // Allow delivery now that agreement is signed
      updatedAt: new Date(),
    });

    console.log(`Updated order ${order.orderNumber} - agreement signed`);

    // Send confirmation email to customer
    try {
      const orderData = order.toObject();
      await agreementEmailService.sendAgreementSigned({
        ...orderData,
        _id: String(orderData._id),
        agreementStatus: "signed",
        agreementSignedAt: new Date(completedAt),
      });
      console.log(
        `Sent agreement signed confirmation email to ${order.customerEmail}`,
      );
    } catch (emailError) {
      console.error("Error sending agreement signed email:", emailError);
      // Don't fail the webhook if email fails
    }
  } catch (error) {
    console.error("Error handling submission completed:", error);
    throw error;
  }
}

/**
 * Handle submission viewed event
 */
async function handleSubmissionViewed(submissionData: any) {
  try {
    const submissionId = submissionData.id;

    // Find the order with this submission ID
    const order = await Order.findOne({
      docusealSubmissionId: String(submissionId),
    });

    if (!order) {
      console.warn(`No order found for submission ${submissionId}`);
      return;
    }

    // Update order to show agreement was viewed (if not already signed)
    if (order.agreementStatus === "pending") {
      await Order.findByIdAndUpdate(order._id, {
        agreementStatus: "viewed",
        agreementViewedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Updated order ${order.orderNumber} - agreement viewed`);
    }
  } catch (error) {
    console.error("Error handling submission viewed:", error);
    throw error;
  }
}

/**
 * Handle submission declined event
 */
async function handleSubmissionDeclined(submissionData: any) {
  try {
    const submissionId = submissionData.id;

    // Find the order with this submission ID
    const order = await Order.findOne({
      docusealSubmissionId: String(submissionId),
    });

    if (!order) {
      console.warn(`No order found for submission ${submissionId}`);
      return;
    }

    // Update order to show agreement was declined
    await Order.findByIdAndUpdate(order._id, {
      agreementStatus: "pending", // Reset to pending so they can resend
      deliveryBlocked: true, // Keep delivery blocked
      updatedAt: new Date(),
    });

    console.log(`Updated order ${order.orderNumber} - agreement declined`);
  } catch (error) {
    console.error("Error handling submission declined:", error);
    throw error;
  }
}
