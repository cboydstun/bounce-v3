import { NextRequest, NextResponse } from "next/server";
import { handleEmailWebhook } from "@/services/marketingService";
import crypto from "crypto";

/**
 * POST endpoint to handle SendGrid webhooks for email tracking
 * This endpoint processes delivery, open, click, bounce, and unsubscribe events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();

    // Get SendGrid signature from headers
    const signature = request.headers.get(
      "x-twilio-email-event-webhook-signature",
    );

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.error("❌ SENDGRID WEBHOOK: Invalid signature", {
          timestamp: new Date().toISOString(),
          receivedSignature: signature,
          expectedSignature,
        });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }

      console.log("✅ SENDGRID WEBHOOK: Signature verified", {
        timestamp: new Date().toISOString(),
      });
    } else if (webhookSecret) {
      console.warn(
        "⚠️ SENDGRID WEBHOOK: No signature provided but secret is configured",
        {
          timestamp: new Date().toISOString(),
        },
      );
    } else {
      console.warn(
        "⚠️ SENDGRID WEBHOOK: No webhook secret configured, skipping signature verification",
        {
          timestamp: new Date().toISOString(),
        },
      );
    }

    // Parse the webhook payload
    let events: any[];
    try {
      events = JSON.parse(body);
    } catch (parseError) {
      console.error("❌ SENDGRID WEBHOOK: Failed to parse JSON", {
        timestamp: new Date().toISOString(),
        error: parseError,
        body: body.substring(0, 500), // Log first 500 chars for debugging
      });
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Validate that events is an array
    if (!Array.isArray(events)) {
      console.error("❌ SENDGRID WEBHOOK: Payload is not an array", {
        timestamp: new Date().toISOString(),
        payload: events,
      });
      return NextResponse.json(
        { error: "Payload must be an array" },
        { status: 400 },
      );
    }

    // Log incoming webhook events
    console.log("📧 SENDGRID WEBHOOK RECEIVED:", {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
      events: events.map((event) => ({
        email: event.email,
        event: event.event,
        timestamp: event.timestamp,
        sg_message_id: event.sg_message_id,
      })),
    });

    // Process the webhook events
    await handleEmailWebhook(events);

    // Log successful processing
    console.log("✅ SENDGRID WEBHOOK PROCESSED:", {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
      processedEvents: events.map((event) => `${event.email}:${event.event}`),
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${events.length} webhook events`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ SENDGRID WEBHOOK ERROR:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for webhook verification (if SendGrid requires it)
 */
export async function GET(request: NextRequest) {
  // Some webhook services require a GET endpoint for verification
  const challenge = request.nextUrl.searchParams.get("challenge");

  console.log("📧 SENDGRID WEBHOOK VERIFICATION:", {
    timestamp: new Date().toISOString(),
    challenge: challenge ? "provided" : "not provided",
    userAgent: request.headers.get("user-agent"),
  });

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    message: "SendGrid webhook endpoint is active",
    timestamp: new Date().toISOString(),
    endpoint: "/api/v1/marketing/webhooks",
  });
}
