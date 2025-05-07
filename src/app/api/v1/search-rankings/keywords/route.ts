import { NextRequest, NextResponse } from "next/server";
import { SearchKeyword } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/v1/search-rankings/keywords
 * Get all keywords
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const keywords = await SearchKeyword.find().sort({ keyword: 1 });

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { message: "Failed to fetch keywords" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/search-rankings/keywords
 * Add a new keyword to track
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json(
        { message: "Keyword is required" },
        { status: 400 },
      );
    }

    // Check if keyword already exists
    const existingKeyword = await SearchKeyword.findOne({
      keyword: { $regex: new RegExp(`^${keyword}$`, "i") },
    });

    if (existingKeyword) {
      return NextResponse.json(
        { message: "Keyword already exists" },
        { status: 400 },
      );
    }

    const newKeyword = await SearchKeyword.create({ keyword });

    return NextResponse.json({ keyword: newKeyword }, { status: 201 });
  } catch (error) {
    console.error("Error creating keyword:", error);
    return NextResponse.json(
      { message: "Failed to create keyword" },
      { status: 500 },
    );
  }
}
