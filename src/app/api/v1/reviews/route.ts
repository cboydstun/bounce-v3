import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Review from "@/models/Review";
import { withAuth, AuthRequest } from "@/middleware/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (placeId) {
      query.placeId = placeId;
    }

    // Execute query with pagination
    const reviews = await Review.find(query)
      .sort({ time: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "email"); // Optionally populate user data

    // Get total count for pagination
    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
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
  return withAuth(request, async (req: AuthRequest) => {
    try {
      await dbConnect();
      const reviewData = await req.json();

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

      // Add user reference if authenticated
      if (req.user) {
        reviewData.user = req.user.id;
      }

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
  });
}
