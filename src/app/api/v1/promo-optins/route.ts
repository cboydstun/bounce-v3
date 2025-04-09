import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import PromoOptin from "@/models/PromoOptin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[PROMO OPTINS API DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

/**
 * GET endpoint to list all promo opt-ins
 * This endpoint is protected and requires authentication
 */
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
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const promoName = url.searchParams.get("promoName");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const searchTerm = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};

    if (email) query.email = email;
    if (promoName) query.promoName = promoName;

    // Date range filter for created date
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Text search if provided
    if (searchTerm) {
      query.$text = { $search: searchTerm };
    }

    // Execute query with pagination
    const promoOptins = await PromoOptin.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await PromoOptin.countDocuments(query);

    return NextResponse.json({
      promoOptins,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching promo opt-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo opt-ins" },
      { status: 500 },
    );
  }
}

/**
 * POST endpoint to create a new promo opt-in
 * This endpoint is public and does not require authentication
 */
export async function POST(request: NextRequest) {
  try {
    debugLog("Processing promo opt-in submission");

    await dbConnect();
    const optinData = await request.json();

    // Validate required fields
    const requiredFields = ["name", "email", "promoName", "consentToContact"];
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

    // Create promo opt-in record
    const promoOptin = await PromoOptin.create(optinData);

    return NextResponse.json(promoOptin, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating promo opt-in:", error);
    return NextResponse.json(
      { error: "Failed to create promo opt-in" },
      { status: 500 },
    );
  }
}
