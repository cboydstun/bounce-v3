import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import Contact from "@/models/Contact";

/**
 * POST /api/v1/products/batch-availability
 * Check availability for multiple products on a specific date
 * Request body:
 * - productIds: Array of product IDs to check
 * - date: The date to check availability for (YYYY-MM-DD)
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Parse request body
    const { productIds, date: dateStr } = await request.json();

    if (!productIds || !Array.isArray(productIds) || !dateStr) {
      return NextResponse.json(
        { error: "Product IDs array and date are required" },
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

    // Find all products in a single query
    const products = await Product.find({ _id: { $in: productIds } }).lean();

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

    // Prepare response with availability for each product
    const results: Record<string, any> = {};
    (products as ProductDocument[]).forEach((product) => {
      const isAvailable =
        product.availability === "available" &&
        !bookedProducts.has(product.name);

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
        results[product._id.toString()].reason =
          product.availability !== "available"
            ? `Product is currently ${product.availability}`
            : "Product is already booked for this date";
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error checking batch availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
