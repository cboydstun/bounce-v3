import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import PromoOptin from "@/models/PromoOptin";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { getCurrentPromotion } from "@/utils/promoUtils";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[PROMO API DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

/**
 * POST endpoint to handle promo opt-in submissions
 * This endpoint is public and does not require authentication
 */
export async function POST(request: NextRequest) {
  try {
    debugLog("Processing promo opt-in submission");

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
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      // Email to admin
      const adminMailOptions = {
        from: optinData.email,
        to: process.env.EMAIL,
        subject: `New Promo Opt-in: ${optinData.promoName}`,
        text: `
          New promotion opt-in from ${optinData.name}.
          Promotion: ${optinData.promoName}
          Name: ${optinData.name}
          Email: ${optinData.email}
          Phone: ${optinData.phone || "Not provided"}
        `,
      };

      await transporter.sendMail(adminMailOptions);

      // Email to customer with coupon
      const customerMailOptions = {
        from: process.env.EMAIL,
        to: optinData.email,
        subject: `Your Special Coupon from SATX Bounce!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #663399; text-align: center;">Your Special Coupon</h1>
            <p>Hello ${optinData.name},</p>
            <p>Thank you for your interest in SATX Bounce! Here's your special coupon code:</p>
            
            <div style="background-color: #f8f5fa; border: 2px dashed #2563eb; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h2 style="color: #2563eb; margin: 0;">BOUNCE25</h2>
              <p style="margin: 10px 0 0 0;">25% off your next bounce house rental!</p>
            </div>
            
            <p>To redeem this coupon, simply mention this code when you book your next party rental.</p>
            <p>This offer is valid for 30 days.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
              <p>SATX Bounce House Rentals</p>
              <p>San Antonio's Premier Party Rental Service</p>
              <p><a href="https://satxbounce.com" style="color: #2563eb;">satxbounce.com</a> | (512) 210-0194</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(customerMailOptions);
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
