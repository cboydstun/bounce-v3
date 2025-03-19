import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contact from "@/models/Contact";
import { withAuth, AuthRequest } from "@/middleware/auth";
import nodemailer from "nodemailer";
import twilio from "twilio";

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthRequest) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return NextResponse.json(
          { error: "Not authorized to view contacts" },
          { status: 403 },
        );
      }

      await dbConnect();

      // Parse query parameters
      const url = new URL(request.url);
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const confirmed = url.searchParams.get("confirmed");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const page = parseInt(url.searchParams.get("page") || "1");
      const skip = (page - 1) * limit;

      // Build query
      const query: Record<string, unknown> = {};

      // Date range filter
      if (startDate && endDate) {
        query.partyDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        query.partyDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.partyDate = { $lte: new Date(endDate) };
      }

      // Confirmation status filter
      if (confirmed !== null && confirmed !== undefined) {
        query.confirmed = confirmed === "true";
      }

      // Execute query with pagination
      const contacts = await Contact.find(query)
        .sort({ partyDate: 1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Contact.countDocuments(query);

      return NextResponse.json({
        contacts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 },
      );
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const contactData = await request.json();

    // Validate required fields
    const requiredFields = [
      "bouncer",
      "email",
      "partyDate",
      "partyZipCode",
      "sourcePage",
    ];
    const missingFields = requiredFields.filter((field) => !contactData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Create contact
    const contact = await Contact.create(contactData);

    // Send email notification
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const mailOptions = {
        from: contactData.email,
        to: process.env.EMAIL,
        subject: `New Bounce Contact ${contactData.bouncer.toUpperCase()}`,
        text: `
                    Incoming bounce house contact from ${contactData.bouncer.toUpperCase()}.
                    Name: ${contactData.bouncer}
                    Email: ${contactData.email}
                    Party Date: ${contactData.partyDate}
                    Party Zip Code: ${contactData.partyZipCode}
                    Phone: ${contactData.phone || "Not provided"}
                    Tables and Chairs: ${contactData.tablesChairs ? "Yes" : "No"}
                    Generator: ${contactData.generator ? "Yes" : "No"}
                    Popcorn Machine: ${contactData.popcornMachine ? "Yes" : "No"}
                    Cotton Candy Machine: ${contactData.cottonCandyMachine ? "Yes" : "No"}
                    Snow Cone Machine: ${contactData.snowConeMachine ? "Yes" : "No"}
                    Margarita Machine: ${contactData.margaritaMachine ? "Yes" : "No"}
                    Slushy Machine: ${contactData.slushyMachine ? "Yes" : "No"}
                    Overnight: ${contactData.overnight ? "Yes" : "No"}
                    Confirmed: NOT YET!
                    Message: ${contactData.message || "No message provided"}
                    Source Page: ${contactData.sourcePage}
                `,
      };

      await transporter.sendMail(mailOptions);
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
                    New Bouncer Job:
                    Bouncer: ${contactData.bouncer}
                    Email: ${contactData.email}
                    Date: ${contactData.partyDate}
                    Phone: ${contactData.phone || "Not provided"}
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

    return NextResponse.json(contact, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 },
    );
  }
}
