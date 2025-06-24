import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/roleAuth";
import { sendEmail } from "@/utils/emailService";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import dbConnect from "@/lib/db/mongoose";

interface SendKudosEmailRequest {
  customerId: string;
  customerType: "order" | "contact";
  subject: string;
  content: string;
  htmlContent: string;
}

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await dbConnect();

    const body = await req.json();

    const {
      customerId,
      customerType,
      subject,
      content,
      htmlContent,
    }: SendKudosEmailRequest = body;

    // Validate required fields
    if (!customerId || !customerType || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let customerEmail: string;
    let customerName: string;

    // Get customer information based on type
    if (customerType === "order") {
      const order = await Order.findById(customerId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Check if kudos email already sent
      if (order.kudosEmailSent) {
        return NextResponse.json(
          { error: "Kudos email has already been sent for this order" },
          { status: 400 },
        );
      }

      if (!order.customerEmail) {
        return NextResponse.json(
          { error: "Customer email not found in order" },
          { status: 400 },
        );
      }

      customerEmail = order.customerEmail;
      customerName = order.customerName || "Valued Customer";

      // Update order with kudos email information
      order.kudosEmailSent = true;
      order.kudosEmailSentAt = new Date();
      order.kudosEmailContent = content;
      await order.save();
    } else if (customerType === "contact") {
      const contact = await Contact.findById(customerId);
      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 },
        );
      }

      customerEmail = contact.email;
      customerName = "Valued Customer"; // Contacts don't have a name field
    } else {
      return NextResponse.json(
        { error: "Invalid customer type" },
        { status: 400 },
      );
    }

    // Get admin email for "from" field
    const adminEmail = process.env.EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 },
      );
    }

    // Send the email
    await sendEmail({
      to: customerEmail,
      from: adminEmail,
      subject,
      text: content,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: "Kudos email sent successfully",
      data: {
        customerEmail,
        customerName,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in kudos send endpoint:", error);

    if (error instanceof Error) {
      // Handle email sending errors
      if (
        error.message.includes("SendGrid") ||
        error.message.includes("email")
      ) {
        return NextResponse.json(
          { error: "Failed to send email. Please try again." },
          { status: 503 },
        );
      }

      // Handle database errors
      if (error.message.includes("Cast to ObjectId failed")) {
        return NextResponse.json(
          { error: "Invalid customer ID" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, handler);
}
