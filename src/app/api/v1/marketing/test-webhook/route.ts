import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { handleEmailWebhook } from "@/services/marketingService";

/**
 * POST endpoint to test webhook functionality with sample data
 * This endpoint is for testing purposes only and requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, eventType = "delivered" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create sample webhook event
    const sampleEvent = {
      email: email,
      event: eventType,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
      sg_message_id: `test-message-${Date.now()}`,
      reason: eventType === "bounce" ? "Test bounce reason" : undefined,
    };

    console.log("🧪 TESTING WEBHOOK with sample event:", {
      timestamp: new Date().toISOString(),
      event: sampleEvent,
    });

    // Process the test webhook event
    await handleEmailWebhook([sampleEvent]);

    return NextResponse.json({
      success: true,
      message: "Test webhook processed successfully",
      testEvent: sampleEvent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ TEST WEBHOOK ERROR:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to process test webhook",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to show available test options
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has admin role
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    message: "Marketing webhook test endpoint",
    usage: {
      method: "POST",
      body: {
        email: "recipient@example.com",
        eventType:
          "delivered | open | click | bounce | dropped | spamreport | unsubscribe",
      },
      example: {
        email: "chrisboydstun@gmail.com",
        eventType: "delivered",
      },
    },
    availableEventTypes: [
      "delivered",
      "open",
      "click",
      "bounce",
      "dropped",
      "spamreport",
      "unsubscribe",
    ],
    timestamp: new Date().toISOString(),
  });
}
