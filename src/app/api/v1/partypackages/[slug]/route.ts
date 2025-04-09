import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import PartyPackage from "@/models/PartyPackage";

/**
 * GET /api/v1/partypackages/[slug]
 * Retrieve a single party package by slug
 * This endpoint is public and does not require authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await dbConnect();

    // Resolve the params Promise
    const resolvedParams = await params;

    // Try to find the party package by slug
    const partyPackage = await PartyPackage.findBySlug(resolvedParams.slug);

    if (!partyPackage) {
      return NextResponse.json(
        { error: "Party package not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(partyPackage);
  } catch (error) {
    console.error("Error fetching party package:", error);
    return NextResponse.json(
      { error: "Failed to fetch party package" },
      { status: 500 },
    );
  }
}
