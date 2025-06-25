import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getEligibleRecipients,
  RecipientFilters,
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

    const filters: RecipientFilters = {};

    // Parse sources
    const sourcesParam = searchParams.get("sources");
    if (sourcesParam) {
      const sources = sourcesParam
        .split(",")
        .filter((s) => ["contacts", "orders", "promoOptins"].includes(s)) as (
        | "contacts"
        | "orders"
        | "promoOptins"
      )[];
      if (sources.length > 0) {
        filters.sources = sources;
      }
    }

    // Parse date range
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    // Parse other filters
    const hasOrders = searchParams.get("hasOrders");
    if (hasOrders === "true") {
      filters.hasOrders = true;
    }

    const consentOnly = searchParams.get("consentOnly");
    if (consentOnly === "false") {
      filters.consentOnly = false;
    } else {
      filters.consentOnly = true; // Default to true for compliance
    }

    const productCategories = searchParams.get("productCategories");
    if (productCategories) {
      filters.productCategories = productCategories.split(",");
    }

    // Get eligible recipients
    const recipients = await getEligibleRecipients(filters);

    // Calculate summary statistics
    const summary = {
      total: recipients.length,
      bySource: {
        contacts: recipients.filter((r) => r.source === "contacts").length,
        orders: recipients.filter((r) => r.source === "orders").length,
        promoOptins: recipients.filter((r) => r.source === "promoOptins")
          .length,
      },
      withConsent: recipients.filter((r) => r.consentStatus).length,
      withOrderHistory: recipients.filter(
        (r) => r.orderHistory && r.orderHistory.length > 0,
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        recipients,
        summary,
        filters: filters,
      },
    });
  } catch (error) {
    console.error("Error fetching marketing recipients:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recipients",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
