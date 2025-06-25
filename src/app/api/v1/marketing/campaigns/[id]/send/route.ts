import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MarketingCampaign from "@/models/MarketingCampaign";
import { sendMarketingCampaign } from "@/services/marketingService";
import dbConnect from "@/lib/db/mongoose";

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
    const body = await request.json();
    const { testMode = false } = body;

    // Get campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign can be sent
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be sent" },
        { status: 400 },
      );
    }

    // Check if campaign has recipients
    if (!campaign.recipients || campaign.recipients.length === 0) {
      return NextResponse.json(
        { error: "Campaign has no recipients" },
        { status: 400 },
      );
    }

    // Update test mode if specified
    if (testMode !== campaign.testMode) {
      campaign.testMode = testMode;

      if (testMode) {
        // 🚨 CRITICAL TEST MODE SAFETY 🚨
        const adminEmail = process.env.OTHER_EMAIL;

        if (!adminEmail) {
          return NextResponse.json(
            {
              error:
                "OTHER_EMAIL environment variable not configured - cannot send test emails",
            },
            { status: 500 },
          );
        }

        // For test mode, replace recipients with admin email only
        campaign.recipients = [
          {
            email: adminEmail,
            name: "Test Admin",
            source: "contacts",
            sourceId: "test",
            status: "pending",
            unsubscribeToken: "test-token",
          },
        ];

        console.log("🚨 TEST MODE RECIPIENTS SET:", {
          timestamp: new Date().toISOString(),
          campaignId,
          campaignName: campaign.name,
          adminEmail,
          recipientCount: 1,
        });
      }

      await campaign.save();

      // Wait for database consistency to prevent race conditions
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update campaign status to sending
    campaign.status = "sending";
    campaign.sentAt = new Date();
    await campaign.save();

    // Start sending emails in background
    sendMarketingCampaign(campaignId).catch((error) => {
      console.error("Error sending campaign:", error);
      // Update campaign status to failed if sending fails
      MarketingCampaign.findByIdAndUpdate(campaignId, {
        status: "failed",
      }).catch((updateError) => {
        console.error("Error updating failed campaign status:", updateError);
      });
    });

    // Log the send action
    console.log("Campaign send initiated:", {
      campaignId,
      campaignName: campaign.name,
      testMode,
      recipientCount: campaign.recipients.length,
      initiatedBy: session.user.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        testMode: campaign.testMode,
        recipientCount: campaign.recipients.length,
        sentAt: campaign.sentAt,
      },
      message: testMode
        ? "Test email is being sent to admin email"
        : `Campaign is being sent to ${campaign.recipients.length} recipients`,
    });
  } catch (error) {
    console.error("Error sending marketing campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to send campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
