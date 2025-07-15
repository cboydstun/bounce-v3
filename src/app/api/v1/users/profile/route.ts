import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get current user's profile (excluding password)
    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Parse request body
    const updateData = await request.json();

    // Validate email if provided
    if (updateData.email) {
      if (!updateData.email.match(/^\S+@\S+\.\S+$/)) {
        return NextResponse.json(
          { error: "Please provide a valid email address" },
          { status: 400 },
        );
      }

      // Check if email is being changed and if it already exists
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: session.user.id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 },
        );
      }
    }

    // Validate password if provided
    if (updateData.password) {
      if (updateData.password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 },
        );
      }
    }

    // Prepare update data (only allow certain fields to be updated)
    const allowedUpdates: any = {};

    if (updateData.name !== undefined) {
      allowedUpdates.name = updateData.name || undefined;
    }

    if (updateData.email) {
      allowedUpdates.email = updateData.email;
    }

    if (updateData.password) {
      allowedUpdates.password = updateData.password;
    }

    // Update user profile
    const user = await User.findByIdAndUpdate(session.user.id, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
