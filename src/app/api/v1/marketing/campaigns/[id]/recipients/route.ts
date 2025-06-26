import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MarketingCampaign, {
  IMarketingRecipient,
} from "@/models/MarketingCampaign";
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

    // Get campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign can be modified
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be modified" },
        { status: 400 },
      );
    }

    // Validate request body
    if (!body.recipients || !Array.isArray(body.recipients)) {
      return NextResponse.json(
        { error: "Recipients array is required" },
        { status: 400 },
      );
    }

    // Validate each recipient
    for (const recipient of body.recipients) {
      if (!recipient.email || !recipient.name) {
        return NextResponse.json(
          { error: "Each recipient must have email and name" },
          { status: 400 },
        );
      }

      // Check for duplicate emails in existing recipients
      const existingRecipient = campaign.recipients.find(
        (r) => r.email.toLowerCase() === recipient.email.toLowerCase(),
      );
      if (existingRecipient) {
        return NextResponse.json(
          { error: `Recipient with email ${recipient.email} already exists` },
          { status: 400 },
        );
      }
    }

    // Generate unsubscribe tokens for new recipients
    const crypto = require("crypto");
    const newRecipients = body.recipients.map((recipient: any) => ({
      email: recipient.email.toLowerCase().trim(),
      name: recipient.name.trim(),
      source: "contacts" as const,
      sourceId: "manual",
      status: "pending" as const,
      unsubscribeToken: crypto.randomBytes(16).toString("hex"),
    }));

    // Add new recipients to campaign
    campaign.recipients.push(...newRecipients);
    await campaign.save();

    console.log("📧 RECIPIENTS ADDED:", {
      timestamp: new Date().toISOString(),
      campaignId,
      campaignName: campaign.name,
      addedCount: newRecipients.length,
      newEmails: newRecipients.map((r: IMarketingRecipient) => r.email),
      totalRecipients: campaign.recipients.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        addedCount: newRecipients.length,
        totalRecipients: campaign.recipients.length,
        addedRecipients: newRecipients.map((r: IMarketingRecipient) => ({
          email: r.email,
          name: r.name,
          status: r.status,
        })),
      },
      message: `Successfully added ${newRecipients.length} recipient(s)`,
    });
  } catch (error) {
    console.error("Error adding recipients:", error);
    return NextResponse.json(
      {
        error: "Failed to add recipients",
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
    const body = await request.json();

    // Get campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign can be modified
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be modified" },
        { status: 400 },
      );
    }

    // Validate request body
    if (!body.emails || !Array.isArray(body.emails)) {
      return NextResponse.json(
        { error: "Emails array is required" },
        { status: 400 },
      );
    }

    const emailsToRemove = body.emails.map((email: string) =>
      email.toLowerCase().trim(),
    );
    const originalCount = campaign.recipients.length;

    // Remove recipients with matching emails
    campaign.recipients = campaign.recipients.filter(
      (recipient) => !emailsToRemove.includes(recipient.email.toLowerCase()),
    );

    const removedCount = originalCount - campaign.recipients.length;

    if (removedCount === 0) {
      return NextResponse.json(
        { error: "No matching recipients found to remove" },
        { status: 400 },
      );
    }

    await campaign.save();

    console.log("🗑️ RECIPIENTS REMOVED:", {
      timestamp: new Date().toISOString(),
      campaignId,
      campaignName: campaign.name,
      removedCount,
      removedEmails: emailsToRemove,
      remainingRecipients: campaign.recipients.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        removedCount,
        totalRecipients: campaign.recipients.length,
      },
      message: `Successfully removed ${removedCount} recipient(s)`,
    });
  } catch (error) {
    console.error("Error removing recipients:", error);
    return NextResponse.json(
      {
        error: "Failed to remove recipients",
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

    // Get campaign
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Check if campaign can be modified
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be modified" },
        { status: 400 },
      );
    }

    // Validate request body
    if (!body.recipient) {
      return NextResponse.json(
        { error: "Recipient data is required" },
        { status: 400 },
      );
    }

    const { recipient } = body;
    if (!recipient.email || !recipient.name) {
      return NextResponse.json(
        { error: "Recipient must have email and name" },
        { status: 400 },
      );
    }

    // Find the recipient to update
    const recipientIndex = campaign.recipients.findIndex(
      (r) => r.email.toLowerCase() === recipient.email.toLowerCase(),
    );

    if (recipientIndex === -1) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 },
      );
    }

    // Update recipient data
    const allowedUpdates = ["name", "email", "status"];
    for (const field of allowedUpdates) {
      if (recipient[field] !== undefined) {
        (campaign.recipients[recipientIndex] as any)[field] = recipient[field];
      }
    }

    // If email was changed, ensure it's lowercase and trimmed
    if (recipient.email) {
      campaign.recipients[recipientIndex].email = recipient.email
        .toLowerCase()
        .trim();
    }

    // If name was changed, ensure it's trimmed
    if (recipient.name) {
      campaign.recipients[recipientIndex].name = recipient.name.trim();
    }

    await campaign.save();

    console.log("✏️ RECIPIENT UPDATED:", {
      timestamp: new Date().toISOString(),
      campaignId,
      campaignName: campaign.name,
      updatedEmail: campaign.recipients[recipientIndex].email,
      updatedFields: Object.keys(recipient),
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedRecipient: {
          email: campaign.recipients[recipientIndex].email,
          name: campaign.recipients[recipientIndex].name,
          status: campaign.recipients[recipientIndex].status,
        },
      },
      message: "Recipient updated successfully",
    });
  } catch (error) {
    console.error("Error updating recipient:", error);
    return NextResponse.json(
      {
        error: "Failed to update recipient",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
