import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/roleAuth";
import { sendEmail } from "@/utils/emailService";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import KudosEmail from "@/models/KudosEmail";
import dbConnect from "@/lib/db/mongoose";
import { getValidatedCustomerName } from "@/utils/nameUtils";

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

    let order: any = null;

    // Get customer information based on type
    if (customerType === "order") {
      order = await Order.findById(customerId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Check if kudos email already sent (for orders, check both order field and KudosEmail collection)
      const existingKudosEmail = await KudosEmail.findByCustomer(
        customerId,
        customerType,
      );
      if (order.kudosEmailSent || existingKudosEmail) {
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
      customerName =
        getValidatedCustomerName(order.customerName) || "Valued Customer";
    } else if (customerType === "contact") {
      const contact = await Contact.findById(customerId);
      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 },
        );
      }

      // Check if kudos email already sent for this contact
      const existingKudosEmail = await KudosEmail.findByCustomer(
        customerId,
        customerType,
      );
      if (existingKudosEmail) {
        return NextResponse.json(
          { error: "Kudos email has already been sent for this contact" },
          { status: 400 },
        );
      }

      customerEmail = contact.email;
      customerName = "Valued Customer"; // Contacts don't have name fields
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

    // Send the email FIRST - if this fails, we don't update the database
    try {
      await sendEmail({
        to: customerEmail,
        from: adminEmail,
        subject,
        text: content,
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("Failed to send kudos email:", emailError);
      throw new Error(
        `Email sending failed: ${emailError instanceof Error ? emailError.message : "Unknown error"}`,
      );
    }

    // Track the kudos email for ALL customer types (orders and contacts)
    try {
      const kudosEmailRecord = new KudosEmail({
        customerId,
        customerType,
        customerEmail,
        subject,
        content,
        sentAt: new Date(),
      });

      await kudosEmailRecord.save();
    } catch (kudosError) {
      console.error("Failed to create kudos email record:", kudosError);
      // Don't throw here - email was sent successfully, just tracking failed
    }

    // Also update the order record if it's an order (for backward compatibility)
    if (customerType === "order" && order) {
      try {
        order.kudosEmailSent = true;
        order.kudosEmailSentAt = new Date();
        order.kudosEmailContent = content;

        const savedOrder = await order.save();

        console.log("Order updated with kudos email:", {
          orderId: savedOrder._id,
          customerId: savedOrder.customerId,
        });
      } catch (saveError) {
        console.error("Failed to save order after sending email:", saveError);
        // Don't throw here - email was sent and tracked in KudosEmail collection
      }
    }

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
