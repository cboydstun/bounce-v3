import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  generateMarketingEmail,
  validateMarketingEmailRequest,
  MarketingEmailRequest,
} from "@/utils/claudeService";
import dbConnect from "@/lib/db/mongoose";

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

    // Connect to database
    await dbConnect();

    // Parse request body
    const body = await request.json();
    const emailRequest: MarketingEmailRequest = {
      campaignType: body.campaignType,
      targetAudience: body.targetAudience,
      keyMessage: body.keyMessage,
      promotionDetails: body.promotionDetails,
      callToAction: body.callToAction,
      tone: body.tone,
      customerData: body.customerData,
    };

    // Validate request data
    try {
      validateMarketingEmailRequest(emailRequest);
    } catch (validationError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details:
            validationError instanceof Error
              ? validationError.message
              : "Invalid request data",
        },
        { status: 400 },
      );
    }

    // Generate email content using Claude API
    const emailContent = await generateMarketingEmail(emailRequest);

    // Log the generation for audit purposes
    console.log("Marketing email generated:", {
      userId: session.user.id,
      campaignType: emailRequest.campaignType,
      targetAudience: emailRequest.targetAudience,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        subject: emailContent.subject,
        content: emailContent.content,
        htmlContent: emailContent.htmlContent,
        generatedAt: new Date().toISOString(),
        prompt: {
          campaignType: emailRequest.campaignType,
          targetAudience: emailRequest.targetAudience,
          keyMessage: emailRequest.keyMessage,
          tone: emailRequest.tone,
        },
      },
    });
  } catch (error) {
    console.error("Error generating marketing email content:", error);

    // Handle specific Claude API errors
    if (error instanceof Error && error.message.includes("Claude API")) {
      return NextResponse.json(
        {
          error: "AI content generation failed",
          details:
            "Unable to generate email content. Please try again or contact support.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate email content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
