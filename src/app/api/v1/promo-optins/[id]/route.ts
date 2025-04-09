import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import PromoOptin from "@/models/PromoOptin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper function to check authentication
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return false;
  }
  return true;
}

/**
 * GET endpoint to retrieve a specific promo opt-in by ID
 * This endpoint is protected and requires authentication
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { params } = context;

  try {
    // Authentication check
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    const promoOptin = await PromoOptin.findById(params.id);

    if (!promoOptin) {
      return NextResponse.json(
        { error: "Promo opt-in not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(promoOptin);
  } catch (error) {
    console.error("Error fetching promo opt-in:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo opt-in" },
      { status: 500 },
    );
  }
}

/**
 * PUT endpoint to update a specific promo opt-in by ID
 * This endpoint is protected and requires authentication
 */
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { params } = context;

  try {
    // Authentication check
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    const data = await request.json();

    // Find and update the promo opt-in
    const updatedPromoOptin = await PromoOptin.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true },
    );

    if (!updatedPromoOptin) {
      return NextResponse.json(
        { error: "Promo opt-in not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedPromoOptin);
  } catch (error) {
    console.error("Error updating promo opt-in:", error);
    return NextResponse.json(
      { error: "Failed to update promo opt-in" },
      { status: 500 },
    );
  }
}

/**
 * DELETE endpoint to delete a specific promo opt-in by ID
 * This endpoint is protected and requires authentication
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { params } = context;

  try {
    // Authentication check
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    const deletedPromoOptin = await PromoOptin.findByIdAndDelete(params.id);

    if (!deletedPromoOptin) {
      return NextResponse.json(
        { error: "Promo opt-in not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Promo opt-in deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting promo opt-in:", error);
    return NextResponse.json(
      { error: "Failed to delete promo opt-in" },
      { status: 500 },
    );
  }
}
