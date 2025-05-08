import { NextRequest, NextResponse } from "next/server";
import { Competitor } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/v1/competitors/[id]
 * Get a specific competitor
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    const competitor = await Competitor.findById(id);

    if (!competitor) {
      return NextResponse.json(
        { message: "Competitor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ competitor });
  } catch (error) {
    console.error("Error fetching competitor:", error);
    return NextResponse.json(
      { message: "Failed to fetch competitor" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/competitors/[id]
 * Update a competitor
 */
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const { name, url, notes, isActive } = await req.json();

    // Validate required fields
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { message: "Name cannot be empty" },
        { status: 400 },
      );
    }

    if (url !== undefined && !url.trim()) {
      return NextResponse.json(
        { message: "URL cannot be empty" },
        { status: 400 },
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();

    if (url !== undefined) {
      // Normalize URL (ensure it has http/https prefix)
      let normalizedUrl = url.trim();
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }
      updateData.url = normalizedUrl;
    }

    if (notes !== undefined) updateData.notes = notes.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    // Check if another competitor with the same name and URL exists
    if (updateData.name && updateData.url) {
      const existingCompetitor = await Competitor.findOne({
        _id: { $ne: id },
        name: updateData.name,
        url: updateData.url,
      });

      if (existingCompetitor) {
        return NextResponse.json(
          {
            message: "Another competitor with this name and URL already exists",
          },
          { status: 400 },
        );
      }
    }

    // Update the competitor
    const competitor = await Competitor.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!competitor) {
      return NextResponse.json(
        { message: "Competitor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ competitor });
  } catch (error) {
    console.error("Error updating competitor:", error);
    return NextResponse.json(
      { message: "Failed to update competitor" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/competitors/[id]
 * Delete a competitor
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } },
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const competitor = await Competitor.findByIdAndDelete(id);

    if (!competitor) {
      return NextResponse.json(
        { message: "Competitor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Competitor deleted successfully" });
  } catch (error) {
    console.error("Error deleting competitor:", error);
    return NextResponse.json(
      { message: "Failed to delete competitor" },
      { status: 500 },
    );
  }
}
