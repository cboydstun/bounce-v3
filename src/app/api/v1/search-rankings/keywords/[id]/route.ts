import { NextRequest, NextResponse } from "next/server";
import { SearchKeyword } from "@/models";
import dbConnect from "@/lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * DELETE /api/v1/search-rankings/keywords/[id]
 * Delete a keyword
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

    const { id } = context.params;

    const keyword = await SearchKeyword.findByIdAndDelete(id);

    if (!keyword) {
      return NextResponse.json(
        { message: "Keyword not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Keyword deleted successfully" });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return NextResponse.json(
      { message: "Failed to delete keyword" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/search-rankings/keywords/[id]
 * Update a keyword (toggle active status)
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

    const { id } = context.params;
    const { isActive } = await req.json();

    if (isActive === undefined) {
      return NextResponse.json(
        { message: "isActive field is required" },
        { status: 400 },
      );
    }

    const keyword = await SearchKeyword.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );

    if (!keyword) {
      return NextResponse.json(
        { message: "Keyword not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ keyword });
  } catch (error) {
    console.error("Error updating keyword:", error);
    return NextResponse.json(
      { message: "Failed to update keyword" },
      { status: 500 },
    );
  }
}
