import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import TaskTemplate from "@/models/TaskTemplate";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to migrate system templates" },
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

    // Create system templates
    const systemTemplates = await TaskTemplate.createSystemTemplates(
      session.user.id,
    );

    return NextResponse.json({
      message: "System templates created successfully",
      templates: systemTemplates,
      count: systemTemplates.length,
    });
  } catch (error: unknown) {
    console.error("Error creating system templates:", error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes("validation failed")) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 },
        );
      }
      if (error.message.includes("already in use")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create system templates" },
      { status: 500 },
    );
  }
}
