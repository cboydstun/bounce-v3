import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Simple in-memory rate limiting (replace with a more robust solution in production)
const ipThrottling = new Map<string, { count: number; timestamp: number }>();

const applyRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5; // 5 login attempts per IP in the window

  const record = ipThrottling.get(ip);

  // If no record exists or the record is expired, create a new one
  if (!record || now - record.timestamp > windowMs) {
    ipThrottling.set(ip, { count: 1, timestamp: now });
    return true;
  }

  // If the record exists and is within the window, increment the count
  if (record.count < maxAttempts) {
    record.count++;
    return true;
  }

  // If the record exists and the count exceeds the limit, block the request
  return false;
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Apply rate limiting
    if (!applyRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts, please try again later" },
        { status: 429 },
      );
    }

    // Connect to database and verify connection
    await dbConnect();

    // Verify MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "MongoDB connection is not ready. Current state:",
        mongoose.connection.readyState,
      );
      return NextResponse.json(
        { error: "Database connection is not ready. Please try again later." },
        { status: 500 },
      );
    }

    // Parse request body
    const { email, password, rememberMe } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Ensure JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Set token expiration based on rememberMe
    const expiresIn = rememberMe ? "30d" : "1d"; // 30 days if remember me is checked, 1 day otherwise
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day in seconds

    // Generate JWT token with appropriate expiration
    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
      expiresIn,
    });

    // Create response with token
    const response = NextResponse.json({ token });

    // Set the token in a cookie (server-side)
    // This will be used by the middleware for route protection
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: false, // Allow JavaScript access for our client-side code
      secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
      maxAge, // Use the maxAge based on rememberMe
      path: "/", // Available across the entire site
      sameSite: "lax", // Provides some CSRF protection
    });

    // Log the token expiration for debugging
    console.log(
      `Token set with expiration: ${expiresIn} (rememberMe: ${rememberMe})`,
    );

    return response;
  } catch (error) {
    // Enhanced error logging
    console.error("Login error details:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      mongooseState: mongoose.connection.readyState,
    });

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("MongoNetworkError")
      ) {
        return NextResponse.json(
          { error: "Database connection failed. Please try again later." },
          { status: 500 },
        );
      } else if (error.message.includes("JWT")) {
        return NextResponse.json(
          {
            error: "Authentication token generation failed. Please try again.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { error: "Authentication failed. Please try again later." },
      { status: 500 },
    );
  }
}
