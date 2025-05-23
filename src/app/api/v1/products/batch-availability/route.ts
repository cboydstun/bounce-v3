import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import Contact from "@/models/Contact";
import Settings from "@/models/Settings";
import { formatDateCT, parseDateCT } from "@/utils/dateUtils";

/**
 * POST /api/v1/products/batch-availability
 * Check availability for multiple products on a specific date
 * Request body:
 * - productIds: Array of product IDs to check
 * - productSlugs: Array of product slugs to check (alternative to productIds)
 * - date: The date to check availability for (YYYY-MM-DD)
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Parse request body
    const { productIds, productSlugs, date: dateStr } = await request.json();

    // Validate that either productIds or productSlugs is provided
    if (
      ((!productIds || !Array.isArray(productIds)) &&
        (!productSlugs || !Array.isArray(productSlugs))) ||
      !dateStr
    ) {
      return NextResponse.json(
        {
          error:
            "Either product IDs or product slugs array and date are required",
        },
        { status: 400 },
      );
    }

    // Parse and validate date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Find all products in a single query based on either IDs or slugs
    let products;
    if (productIds && productIds.length > 0) {
      products = await Product.find({ _id: { $in: productIds } }).lean();
    } else if (productSlugs && productSlugs.length > 0) {
      products = await Product.find({ slug: { $in: productSlugs } }).lean();
    } else {
      return NextResponse.json(
        { error: "No valid product identifiers provided" },
        { status: 400 },
      );
    }

    // Type assertion for products
    interface ProductDocument {
      _id: { toString(): string };
      name: string;
      slug: string;
      availability: string;
    }

    // Set up date range for booking check
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all bookings for these products on the date in a single query
    const bookings = await Contact.find({
      bouncer: { $in: products.map((p) => p.name) },
      partyDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      confirmed: "Confirmed",
    });

    // Create a map of product name to booking status
    const bookedProducts = new Set(bookings.map((booking) => booking.bouncer));

    // Get the total number of confirmed bookings for this date
    const totalBookingsForDate = await Contact.countDocuments({
      partyDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      confirmed: "Confirmed",
    });

    // Get the settings including blackout dates
    const settings = await Settings.getSettings();
    const maxDailyBookings = settings.maxDailyBookings;

    // Check if the selected date is a blackout date using our centralized date utility
    // Parse the input date string to a Date object in Central Time
    const selectedDateCT = parseDateCT(dateStr);

    // Format the selected date in Central Time as YYYY-MM-DD for comparison
    const selectedDateString = formatDateCT(selectedDateCT);
    // Convert all blackout dates to Central Time strings for comparison using our utility
    const blackoutDatesCT = settings.blackoutDates.map((d: Date) =>
      formatDateCT(new Date(d)),
    );

    // Use string comparison in Central Time
    const isBlackoutDate = blackoutDatesCT.includes(selectedDateString);

    // If it's a blackout date, mark all products as unavailable
    if (isBlackoutDate) {
      const results: Record<string, any> = {};

      (products as ProductDocument[]).forEach((product) => {
        results[product._id.toString()] = {
          available: false,
          product: {
            name: product.name,
            slug: product.slug,
            status: product.availability,
          },
          reason: "This date is unavailable for booking (blackout date)",
        };
      });

      return NextResponse.json({
        ...results,
        _meta: {
          isBlackoutDate: true,
          dateAtCapacity: true, // Treat blackout dates as at capacity
          totalBookings: totalBookingsForDate,
          maxBookings: maxDailyBookings,
        },
      });
    }

    // Check if the date has reached its booking limit
    const dateAtCapacity = totalBookingsForDate >= maxDailyBookings;

    // Prepare response with availability for each product
    const results: Record<string, any> = {};
    (products as ProductDocument[]).forEach((product) => {
      const isProductAvailable =
        product.availability === "available" &&
        !bookedProducts.has(product.name);

      // Product is unavailable if either the product is booked/unavailable
      // OR the date has reached its booking limit
      const isAvailable = isProductAvailable && !dateAtCapacity;

      results[product._id.toString()] = {
        available: isAvailable,
        product: {
          name: product.name,
          slug: product.slug,
          status: product.availability,
        },
      };

      // Add reason if not available
      if (!isAvailable) {
        if (dateAtCapacity && isProductAvailable) {
          results[product._id.toString()].reason =
            `Maximum bookings reached for this date (${totalBookingsForDate}/${maxDailyBookings})`;
        } else {
          results[product._id.toString()].reason =
            product.availability !== "available"
              ? `Product is currently ${product.availability}`
              : "Product is already booked for this date";
        }
      }
    });

    // Add date capacity information to the response
    return NextResponse.json({
      ...results,
      _meta: {
        isBlackoutDate: false,
        dateAtCapacity,
        totalBookings: totalBookingsForDate,
        maxBookings: maxDailyBookings,
      },
    });
  } catch (error) {
    console.error("Error checking batch availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
