import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import PartyPackage from "@/models/PartyPackage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

interface PackageQuery {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // For potential future query parameters
}

/**
 * GET /api/v1/partypackages
 * Retrieve all party packages with filtering (no pagination)
 * This endpoint is public and does not require authentication
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    // Build query
    const query: PackageQuery = {};

    let packages;
    let total;

    // If search query is provided, use text search
    if (search) {
      packages = await PartyPackage.searchPackages(search);
      total = await PartyPackage.countDocuments({ $text: { $search: search } });
    } else {
      // Otherwise, use regular query
      packages = await PartyPackage.find(query).sort({ createdAt: -1 });
      total = await PartyPackage.countDocuments(query);
    }

    return NextResponse.json({
      packages,
      total,
    });
  } catch (error) {
    console.error("Error fetching party packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch party packages" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/partypackages
 * Create a new party package (admin only)
 * This endpoint requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to create party packages" },
        { status: 401 },
      );
    }

    // Validate that we have a proper user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User session is invalid - missing user ID" },
        { status: 401 },
      );
    }

    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "User session is invalid - invalid user ID format" },
        { status: 401 },
      );
    }

    await dbConnect();

    const packageData = await request.json();

    // Validate required fields
    const requiredFields = [
      "id",
      "name",
      "description",
      "items",
      "totalRetailPrice",
      "packagePrice",
      "savings",
      "savingsPercentage",
      "recommendedPartySize",
      "ageRange",
      "duration",
      "spaceRequired",
    ];

    const missingFields = requiredFields.filter((field) => {
      if (field === "recommendedPartySize") {
        return (
          !packageData.recommendedPartySize ||
          packageData.recommendedPartySize.min === undefined ||
          packageData.recommendedPartySize.max === undefined
        );
      }
      if (field === "ageRange") {
        return (
          !packageData.ageRange ||
          packageData.ageRange.min === undefined ||
          packageData.ageRange.max === undefined
        );
      }
      if (field === "items") {
        return (
          !packageData.items ||
          !Array.isArray(packageData.items) ||
          packageData.items.length === 0
        );
      }
      return !packageData[field];
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Create party package
    const partyPackage = await PartyPackage.create(packageData);

    return NextResponse.json(partyPackage, { status: 201 });
  } catch (error) {
    console.error("Error creating party package:", error);
    return NextResponse.json(
      { error: "Failed to create party package" },
      { status: 500 },
    );
  }
}
