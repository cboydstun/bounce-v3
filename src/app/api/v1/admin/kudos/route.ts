import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/middleware/roleAuth";
import Order from "@/models/Order";
import Contact from "@/models/Contact";
import dbConnect from "@/lib/db/mongoose";

interface EligibleCustomer {
  id: string;
  type: "order" | "contact";
  customerName: string;
  customerEmail: string;
  eventDate: string;
  rentalItems: string[];
  kudosEmailSent: boolean;
  kudosEmailSentAt?: string;
  createdAt: string;
}

async function handler(req: NextRequest) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const kudosEmailSent = searchParams.get("kudosEmailSent");

    // Default to last 30 days if no date range provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultEndDate.getDate() - 30);

    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Set end date to end of day
    queryEndDate.setHours(23, 59, 59, 999);

    const eligibleCustomers: EligibleCustomer[] = [];

    // Fetch eligible orders
    const orderQuery: any = {
      eventDate: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
      customerEmail: { $exists: true, $ne: null },
    };

    // Filter by kudos email status if specified
    if (kudosEmailSent === "true") {
      orderQuery.kudosEmailSent = true;
    } else if (kudosEmailSent === "false") {
      orderQuery.kudosEmailSent = { $ne: true };
    }

    const orders = await Order.find(orderQuery).sort({ eventDate: -1 }).lean();

    // Process orders
    for (const order of orders) {
      if (order.customerEmail) {
        eligibleCustomers.push({
          id: order._id.toString(),
          type: "order",
          customerName: order.customerName || "Valued Customer",
          customerEmail: order.customerEmail,
          eventDate:
            order.eventDate?.toISOString() || order.createdAt.toISOString(),
          rentalItems: order.items?.map((item: any) => item.name) || [],
          kudosEmailSent: order.kudosEmailSent || false,
          kudosEmailSentAt: order.kudosEmailSentAt?.toISOString(),
          createdAt: order.createdAt.toISOString(),
        });
      }
    }

    // Fetch eligible contacts (for events that occurred in the date range)
    const contactQuery: any = {
      partyDate: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
      email: { $exists: true, $ne: null },
    };

    const contacts = await Contact.find(contactQuery)
      .sort({ partyDate: -1 })
      .lean();

    // Process contacts (contacts don't have kudos email tracking, so they're always eligible)
    if (kudosEmailSent !== "true") {
      // Only include contacts if not filtering for sent emails
      for (const contact of contacts) {
        // Check if this contact already has an order (to avoid duplicates)
        const hasOrder = eligibleCustomers.some(
          (customer) => customer.customerEmail === contact.email,
        );

        if (!hasOrder) {
          const rentalItems = [];
          if (contact.bouncer) rentalItems.push(contact.bouncer);
          if (contact.tablesChairs) rentalItems.push("Tables & Chairs");
          if (contact.generator) rentalItems.push("Generator");
          if (contact.popcornMachine) rentalItems.push("Popcorn Machine");
          if (contact.cottonCandyMachine)
            rentalItems.push("Cotton Candy Machine");
          if (contact.snowConeMachine) rentalItems.push("Snow Cone Machine");
          if (contact.basketballShoot) rentalItems.push("Basketball Shoot");
          if (contact.slushyMachine) rentalItems.push("Slushy Machine");

          eligibleCustomers.push({
            id: contact._id.toString(),
            type: "contact",
            customerName: "Valued Customer", // Contacts don't have names
            customerEmail: contact.email,
            eventDate: contact.partyDate.toISOString(),
            rentalItems,
            kudosEmailSent: false, // Contacts don't track kudos emails
            createdAt:
              contact.createdAt?.toISOString() ||
              contact.partyDate.toISOString(),
          });
        }
      }
    }

    // Sort by event date (most recent first)
    eligibleCustomers.sort(
      (a, b) =>
        new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
    );

    return NextResponse.json({
      success: true,
      customers: eligibleCustomers,
      total: eligibleCustomers.length,
      dateRange: {
        startDate: queryStartDate.toISOString(),
        endDate: queryEndDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching eligible customers:", error);

    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes("connection")) {
        return NextResponse.json(
          { error: "Database connection error" },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return withAdminAuth(req, handler);
}
