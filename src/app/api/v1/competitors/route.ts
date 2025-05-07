import { NextRequest, NextResponse } from "next/server";
import { Competitor } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/v1/competitors
 * Get all competitors
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const competitors = await Competitor.find().sort({ name: 1 });
    
    return NextResponse.json({ competitors });
  } catch (error) {
    console.error("Error fetching competitors:", error);
    return NextResponse.json(
      { message: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/competitors
 * Add a new competitor
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, url, notes, isActive } = await req.json();
    
    if (!name || !url) {
      return NextResponse.json(
        { message: "Name and URL are required" },
        { status: 400 }
      );
    }

    // Normalize URL (ensure it has http/https prefix)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Check if competitor with same name and URL already exists
    const existingCompetitor = await Competitor.findOne({
      name: name.trim(),
      url: normalizedUrl
    });
    
    if (existingCompetitor) {
      return NextResponse.json(
        { message: "Competitor with this name and URL already exists" },
        { status: 400 }
      );
    }

    // Create the competitor
    const competitor = await Competitor.create({
      name: name.trim(),
      url: normalizedUrl,
      notes: notes?.trim(),
      isActive: isActive !== undefined ? isActive : true
    });
    
    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    console.error("Error creating competitor:", error);
    return NextResponse.json(
      { message: "Failed to create competitor" },
      { status: 500 }
    );
  }
}
