import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MarketingCampaign from "@/models/MarketingCampaign";
import { sendEmail, EmailData } from "@/utils/emailService";
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

    // Validate request body
    if (!body.emails || !Array.isArray(body.emails)) {
      return NextResponse.json(
        { error: "Emails array is required" },
        { status: 400 },
      );
    }

    const emailsToResend = body.emails.map((email: string) =>
      email.toLowerCase().trim(),
    );

    // Find recipients to resend to
    const recipientsToResend = campaign.recipients.filter((recipient) =>
      emailsToResend.includes(recipient.email.toLowerCase()),
    );

    if (recipientsToResend.length === 0) {
      return NextResponse.json(
        { error: "No matching recipients found to resend" },
        { status: 400 },
      );
    }

    console.log("🔄 RESEND INITIATED:", {
      timestamp: new Date().toISOString(),
      campaignId,
      campaignName: campaign.name,
      resendCount: recipientsToResend.length,
      resendEmails: recipientsToResend.map((r) => r.email),
    });

    // Reset status and attempt to resend emails
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipientsToResend) {
      try {
        // Reset recipient status
        recipient.status = "pending";
        recipient.failureReason = undefined;

        // Prepare email content
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?token=${recipient.unsubscribeToken}`;
        const emailContent =
          campaign.htmlContent +
          `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>You received this email because you opted in to receive marketing communications from us.</p>
            <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe from marketing emails</a></p>
          </div>
        `;

        const emailData: EmailData = {
          to: recipient.email,
          from: process.env.EMAIL || "noreply@example.com",
          subject: campaign.subject,
          text: campaign.content,
          html: emailContent,
        };

        // Send email
        await sendEmail(emailData);

        // Update recipient status on success
        recipient.status = "sent";
        recipient.sentAt = new Date();
        successCount++;

        console.log("✅ RESEND SUCCESS:", {
          timestamp: new Date().toISOString(),
          email: recipient.email,
          campaignId,
        });
      } catch (error) {
        // Update recipient status on failure
        recipient.status = "failed";
        recipient.failureReason =
          error instanceof Error ? error.message : "Unknown error";
        failureCount++;

        console.error("❌ RESEND FAILED:", {
          timestamp: new Date().toISOString(),
          email: recipient.email,
          campaignId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Save campaign with updated recipient statuses
    await campaign.save();

    return NextResponse.json({
      success: true,
      data: {
        totalAttempted: recipientsToResend.length,
        successCount,
        failureCount,
        recipients: recipientsToResend.map((r) => ({
          email: r.email,
          status: r.status,
          sentAt: r.sentAt,
          failureReason: r.failureReason,
        })),
      },
      message: `Resend completed: ${successCount} successful, ${failureCount} failed`,
    });
  } catch (error) {
    console.error("Error resending emails:", error);
    return NextResponse.json(
      {
        error: "Failed to resend emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
