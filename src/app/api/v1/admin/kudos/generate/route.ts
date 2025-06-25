import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/roleAuth";
import {
  generateKudosEmail,
  validateKudosEmailRequest,
  KudosEmailRequest,
} from "@/utils/claudeService";

// Allow up to 30 seconds for Claude API calls to prevent Vercel timeout
export const maxDuration = 30;

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();

    // Validate the request data
    const kudosRequest: KudosEmailRequest = {
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      eventDate: body.eventDate,
      rentalItems: body.rentalItems || [],
      positiveComment1: body.positiveComment1,
      positiveComment2: body.positiveComment2,
      positiveComment3: body.positiveComment3,
    };

    // Validate the request
    validateKudosEmailRequest(kudosRequest);

    // Generate the email using Claude
    const emailResponse = await generateKudosEmail(kudosRequest);

    return NextResponse.json({
      success: true,
      data: emailResponse,
    });
  } catch (error) {
    console.error("Error in kudos generate endpoint:", error);

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes("Validation failed")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Handle Claude API errors
      if (error.message.includes("Claude API")) {
        return NextResponse.json(
          { error: "Failed to generate email. Please try again." },
          { status: 503 },
        );
      }

      // Handle configuration errors
      if (error.message.includes("not configured")) {
        return NextResponse.json(
          { error: "Email generation service is not available" },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, handler);
}
