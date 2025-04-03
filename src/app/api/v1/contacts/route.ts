import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Contact from "@/models/Contact";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[CONTACTS API DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found, returning 401");
      return NextResponse.json(
        { error: "Not authorized to view contacts" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const deliveryDay = url.searchParams.get("deliveryDay");
    const confirmed = url.searchParams.get("confirmed");

    // Build query
    const query: Record<string, unknown> = {};

    // Date range filter for party date
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

    // Filter by delivery day
    if (deliveryDay) {
      // Create a date range for the entire day
      const startOfDay = new Date(deliveryDay);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(deliveryDay);
      endOfDay.setHours(23, 59, 59, 999);

      query.deliveryDay = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // Confirmation status filter
    if (confirmed !== null && confirmed !== undefined) {
      if (confirmed === "true") {
        query.confirmed = "Confirmed";
      } else if (confirmed === "false") {
        query.confirmed = "Pending";
      }
      // For backward compatibility, also handle the case where confirmed is a boolean in the database
      // This can be removed once all documents have been migrated to use the string enum
    }

    // Execute query without pagination to allow client-side filtering and pagination
    const contacts = await Contact.find(query).sort({ partyDate: 1 });

    return NextResponse.json({
      contacts,
    });
  } catch (error: unknown) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session for POST");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result for POST", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found for POST, returning 401");
      return NextResponse.json(
        { error: "Not authorized to create contacts" },
        { status: 401 },
      );
    }

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

    // Ensure confirmed field is a string enum value if provided
    if (contactData.confirmed !== undefined) {
      if (typeof contactData.confirmed === "boolean") {
        contactData.confirmed = contactData.confirmed ? "Confirmed" : "Pending";
      }
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
                    Basketball Shoot: ${contactData.basketballShoot ? "Yes" : "No"}
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
