import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MarketingCampaign from "@/models/MarketingCampaign";
import {
  getCampaignAnalytics,
  sendMarketingCampaign,
} from "@/services/marketingService";
import dbConnect from "@/lib/db/mongoose";

export async function GET(
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

    // Get campaign details
    const campaign = await MarketingCampaign.findById(campaignId)
      .populate("createdBy", "name email")
      .lean();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Get detailed analytics
    const analytics = await getCampaignAnalytics(campaignId);

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          description: campaign.description,
          subject: campaign.subject,
          content: campaign.content,
          htmlContent: campaign.htmlContent,
          template: campaign.template,
          recipientSources: campaign.recipientSources,
          filters: campaign.filters,
          status: campaign.status,
          testMode: campaign.testMode,
          createdBy: campaign.createdBy,
          createdAt: campaign.createdAt,
          sentAt: campaign.sentAt,
          completedAt: campaign.completedAt,
          aiGenerationPrompt: campaign.aiGenerationPrompt,
          notes: campaign.notes,
        },
        analytics,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaign details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    // Get existing campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign can be modified
    if (campaign.status === "sending" || campaign.status === "completed") {
      return NextResponse.json(
        { error: "Cannot modify campaign that is sending or completed" },
        { status: 400 },
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "description",
      "subject",
      "content",
      "htmlContent",
      "notes",
      "testMode",
    ];

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        (campaign as any)[field] = body[field];
      }
    }

    await campaign.save();

    return NextResponse.json({
      success: true,
      data: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        updatedAt: campaign.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to update campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Get existing campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign can be deleted
    if (campaign.status === "sending") {
      return NextResponse.json(
        { error: "Cannot delete campaign that is currently sending" },
        { status: 400 },
      );
    }

    // Delete campaign
    await MarketingCampaign.findByIdAndDelete(campaignId);

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to delete campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
