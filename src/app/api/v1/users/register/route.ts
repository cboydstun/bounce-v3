import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";

export async function POST(request: NextRequest) {
    try {
        // Connect to database
        await dbConnect();

        // Parse request body
        const userData = await request.json();

        // Validate input
        if (!userData.email || !userData.password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Create new user
        const user = await User.create({
            email: userData.email,
            password: userData.password,
        });

        // Create a response object without the password
        const { password, ...userResponse } = user.toObject();

        return NextResponse.json(userResponse, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Registration failed" },
            { status: 500 }
        );
    }
}
