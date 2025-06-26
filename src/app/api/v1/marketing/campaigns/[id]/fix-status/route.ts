import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MarketingCampaign from "@/models/MarketingCampaign";
import dbConnect from "@/lib/db/mongoose";

/**
 * POST endpoint to fix recipient status for campaigns stuck in "pending"
 * This is a temporary fix for the webhook issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const campaignId = params.id;

    // Get campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign is completed (emails were sent)
    if (campaign.status !== "completed") {
      return NextResponse.json(
        { error: "Campaign must be completed to fix status" },
        { status: 400 },
      );
    }

    let updatedCount = 0;
    let alreadyCorrect = 0;

    // Update all "pending" recipients to "sent" if the campaign was completed
    for (const recipient of campaign.recipients) {
      if (recipient.status === "pending") {
        recipient.status = "sent";
        recipient.sentAt = campaign.sentAt || new Date();
        updatedCount++;

        console.log("🔧 FIXING RECIPIENT STATUS:", {
          timestamp: new Date().toISOString(),
          campaignId,
          email: recipient.email,
          oldStatus: "pending",
          newStatus: "sent",
          sentAt: recipient.sentAt,
        });
      } else {
        alreadyCorrect++;
      }
    }

    // Save the campaign
    await campaign.save();

    console.log("✅ CAMPAIGN STATUS FIX COMPLETE:", {
      timestamp: new Date().toISOString(),
      campaignId,
      campaignName: campaign.name,
      updatedCount,
      alreadyCorrect,
      totalRecipients: campaign.recipients.length,
    });

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} recipient statuses`,
      data: {
        campaignId,
        campaignName: campaign.name,
        updatedCount,
        alreadyCorrect,
        totalRecipients: campaign.recipients.length,
      },
    });
  } catch (error) {
    console.error("❌ ERROR FIXING CAMPAIGN STATUS:", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to fix campaign status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
