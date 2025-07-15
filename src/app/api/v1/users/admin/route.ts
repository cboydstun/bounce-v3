import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Connect to database
    await dbConnect();

    // Parse request body
    const userData = await request.json();

    // Validate input
    if (!userData.email || !userData.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!userData.role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["admin", "user", "customer"];
    if (!validRoles.includes(userData.role)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 },
      );
    }

    // Validate password strength
    if (userData.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Create new user with specified role
    const user = await User.create({
      email: userData.email,
      password: userData.password,
      name: userData.name || undefined,
      role: userData.role,
    });

    // Create a response object without the password
    const { password, ...userResponse } = user.toObject();

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error("Admin user creation error:", error);
    return NextResponse.json(
      { error: "User creation failed" },
      { status: 500 },
    );
  }
}
