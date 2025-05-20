import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Settings from "@/models/Settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { parseDateCT, formatDateCT } from "@/utils/dateUtils";

// GET /api/v1/settings
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const settings = await Settings.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// PATCH /api/v1/settings
export async function PATCH(request: NextRequest) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();
    const data = await request.json();

    // Validate input
    if (
      data.maxDailyBookings !== undefined &&
      (typeof data.maxDailyBookings !== "number" || data.maxDailyBookings < 1)
    ) {
      return NextResponse.json(
        { error: "maxDailyBookings must be a positive number" },
        { status: 400 },
      );
    }

    // Get existing settings or create default
    let settings = await Settings.getSettings();

    // Ensure blackoutDates is initialized as an array
    if (!settings.blackoutDates) {
      settings.blackoutDates = [];
    }

    // Update only provided fields
    if (data.maxDailyBookings !== undefined) {
      settings.maxDailyBookings = data.maxDailyBookings;
    }

    // Handle blackout dates operations
    if (data.addBlackoutDate) {
      // Add a new blackout date using our centralized date utility
      const centralTimeDate = parseDateCT(data.addBlackoutDate);

      if (!isNaN(centralTimeDate.getTime())) {
        // Check if date already exists - compare by YYYY-MM-DD string in Central Time
        const dateString = data.addBlackoutDate;
        const dateExists =
          Array.isArray(settings.blackoutDates) &&
          settings.blackoutDates.some((date: Date) => {
            // Convert existing date to Central Time string format (YYYY-MM-DD)
            const existingDateString = formatDateCT(new Date(date));
            return existingDateString === dateString;
          });

        if (!dateExists) {
          settings.blackoutDates.push(centralTimeDate);
        }
      }
    }

    if (data.removeBlackoutDate) {
      // Remove a blackout date
      // Use the date string for comparison in Central Time
      const dateString = data.removeBlackoutDate;

      if (Array.isArray(settings.blackoutDates)) {
        settings.blackoutDates = settings.blackoutDates.filter((date: Date) => {
          // Convert existing date to Central Time string format (YYYY-MM-DD)
          const existingDateString = formatDateCT(new Date(date));
          return existingDateString !== dateString;
        });
      }
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
