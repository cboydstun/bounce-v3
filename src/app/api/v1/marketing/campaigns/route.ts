import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MarketingCampaign from "@/models/MarketingCampaign";
import {
  createMarketingRecipients,
  sendMarketingCampaign,
  getEligibleRecipients,
} from "@/services/marketingService";
import dbConnect from "@/lib/db/mongoose";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Get campaigns with pagination
    const campaigns = await MarketingCampaign.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate("createdBy", "name email")
      .lean();

    // Get total count for pagination
    const total = await MarketingCampaign.countDocuments(query);

    // Calculate summary statistics for each campaign
    const campaignsWithStats = campaigns.map((campaign) => ({
      id: campaign._id,
      name: campaign.name,
      description: campaign.description,
      subject: campaign.subject,
      template: campaign.template,
      status: campaign.status,
      testMode: campaign.testMode,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt,
      sentAt: campaign.sentAt,
      completedAt: campaign.completedAt,
      stats: campaign.stats,
      recipientCount: campaign.recipients?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsWithStats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching marketing campaigns:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

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

    // Validate required fields
    const requiredFields = ["name", "subject", "content", "htmlContent"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Get recipients based on filters
    const recipients = await getEligibleRecipients(body.filters || {});

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No eligible recipients found with the specified filters" },
        { status: 400 },
      );
    }

    // Create marketing recipients
    const marketingRecipients = createMarketingRecipients(recipients);

    // Generate unsubscribe token
    const crypto = require("crypto");
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    // Create campaign
    const campaign = new MarketingCampaign({
      name: body.name,
      description: body.description,
      subject: body.subject,
      content: body.content,
      htmlContent: body.htmlContent,
      template: body.template || "custom",
      recipientSources: body.recipientSources || [
        "contacts",
        "orders",
        "promoOptins",
      ],
      recipients: marketingRecipients,
      filters: body.filters || { consentOnly: true },
      createdBy: session.user.id,
      testMode: body.testMode || false,
      aiGenerationPrompt: body.aiGenerationPrompt,
      notes: body.notes,
      unsubscribeToken: unsubscribeToken,
    });

    await campaign.save();

    // If sendImmediately is true and not in test mode, start sending
    if (body.sendImmediately && !body.testMode) {
      // Start sending in background (don't await)
      sendMarketingCampaign(String(campaign._id)).catch((error) => {
        console.error("Error sending campaign:", error);
      });
    } else if (body.sendImmediately && body.testMode) {
      // For test mode, send only to admin email
      const testRecipients = [
        {
          email: session.user.email || process.env.EMAIL || "admin@example.com",
          name: "Test Admin",
          source: "contacts" as const,
          sourceId: "test",
          status: "pending" as const,
          unsubscribeToken: "test-token",
        },
      ];

      campaign.recipients = testRecipients;
      await campaign.save();

      // Send test email
      sendMarketingCampaign(String(campaign._id)).catch((error) => {
        console.error("Error sending test campaign:", error);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        recipientCount: campaign.recipients.length,
        testMode: campaign.testMode,
        createdAt: campaign.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating marketing campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
