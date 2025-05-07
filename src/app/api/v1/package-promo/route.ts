import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import PromoOptin from "@/models/PromoOptin";
import { sendEmail } from "@/utils/emailService";
import twilio from "twilio";
import { getCurrentPromotion } from "@/utils/promoUtils";

/**
 * POST endpoint to handle promo opt-in submissions
 * This endpoint is public and does not require authentication
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const optinData = await request.json();

    // Validate required fields
    const requiredFields = ["name", "email", "consentToContact"];
    const missingFields = requiredFields.filter((field) => !optinData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Ensure consent is provided
    if (!optinData.consentToContact) {
      return NextResponse.json(
        { error: "Consent to contact is required" },
        { status: 400 },
      );
    }

    // Get current promotion if not provided
    if (!optinData.promoName) {
      try {
        // Try to get holidays from promos.json
        const promos = await import("../../../../../promos.json");
        const currentPromo = getCurrentPromotion(promos.holidays);
        if (currentPromo) {
          optinData.promoName = currentPromo.name;
        } else {
          optinData.promoName = "General Promotion";
        }
      } catch (error) {
        // Fallback if we can't get the current promotion
        optinData.promoName = "General Promotion";
      }
    }

    // Create promo opt-in record directly
    const promoOptin = await PromoOptin.create(optinData);

    // Send email notification
    try {
      await sendEmail({
        from: process.env.EMAIL as string, // Must be a verified sender in SendGrid
        to: process.env.EMAIL as string,
        subject: `New Promo Opt-in: ${optinData.promoName}`,
        text: `
          New promotion opt-in from ${optinData.name}.
          Promotion: ${optinData.promoName}
          Name: ${optinData.name}
          Email: ${optinData.email}
          Phone: ${optinData.phone || "Not provided"}
        `,
      });
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
      // Continue execution even if email fails
    }

    // Send SMS notification
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (accountSid && authToken) {
        const client = twilio(accountSid, authToken);

        const smsBody = `
          New Promo Opt-in:
          Promotion: ${optinData.promoName}
          Name: ${optinData.name}
          Email: ${optinData.email}
          Phone: ${optinData.phone || "Not provided"}
        `.trim();

        await client.messages.create({
          body: smsBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.USER_PHONE_NUMBER || "",
        });
      }
    } catch (smsError) {
      console.error("Error sending SMS notification:", smsError);
      // Continue execution even if SMS fails
    }

    return NextResponse.json(promoOptin, { status: 201 });
  } catch (error: unknown) {
    console.error("Error processing promo opt-in:", error);
    return NextResponse.json(
      { error: "Failed to process promo opt-in" },
      { status: 500 },
    );
  }
}
