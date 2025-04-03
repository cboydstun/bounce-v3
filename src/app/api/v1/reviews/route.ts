import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Review from "@/models/Review";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[REVIEWS API DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (placeId) {
      query.placeId = placeId;
    }

    // Execute query without pagination - return all reviews
    const reviews = await Review.find(query)
      .sort({ time: -1 })
      .populate("user", "email"); // Optionally populate user data

    // Set total count to the number of reviews returned
    const total = reviews.length;

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page: 1,
        limit: total,
        pages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session for POST /api/v1/reviews");
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
    const reviewData = await request.json();

    // Validate required fields
    if (
      !reviewData.placeId ||
      !reviewData.authorName ||
      !reviewData.rating ||
      !reviewData.text
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate a unique reviewId if not provided
    if (!reviewData.reviewId) {
      reviewData.reviewId = new mongoose.Types.ObjectId().toString();
    }

    // Add user reference from session
    reviewData.user = session.user.id;

    // Create review
    const review = await Review.create(reviewData);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);

    // Handle validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
