import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import Contact from "@/models/Contact";
import {
  parseDateStartOfDayUTC,
  parseDateEndOfDayUTC,
} from "@/utils/dateUtils";

/**
 * Checks if a product is available on a specific date
 * @param product The product document
 * @param dateStr The date string to check availability for (YYYY-MM-DD)
 * @returns A promise that resolves to true if the product is available, false otherwise
 */
async function checkProductAvailability(
  product: any,
  dateStr: string,
): Promise<boolean> {
  // 1. Check if product's general status is "available"
  if (product.availability !== "available") {
    return false;
  }

  // 2. Check for confirmed bookings on the date using proper UTC utilities
  const startOfDay = parseDateStartOfDayUTC(dateStr);
  const endOfDay = parseDateEndOfDayUTC(dateStr);

  const bookings = await Contact.find({
    bouncer: product.name,
    partyDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    confirmed: { $in: ["Confirmed", "Converted"] },
  });

  return bookings.length === 0;
}

/**
 * Gets the reason why a product is unavailable
 * @param product The product document
 * @param date The date that was checked
 * @returns A string explaining why the product is unavailable
 */
function getUnavailabilityReason(product: any, date: Date): string {
  if (product.availability !== "available") {
    return `Product is currently ${product.availability}`;
  }
  return "Product is already booked for this date";
}

/**
 * GET /api/v1/products/availability
 * Check if a product is available on a specific date
 * Query parameters:
 * - productId: The ID of the product to check
 * - slug: The slug of the product to check (alternative to productId)
 * - date: The date to check availability for (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const slug = url.searchParams.get("slug");
    const dateStr = url.searchParams.get("date");

    // Validate parameters
    if ((!productId && !slug) || !dateStr) {
      return NextResponse.json(
        { error: "Product ID/slug and date are required" },
        { status: 400 },
      );
    }

    // Find product
    let product = null;
    try {
      if (productId) {
        product = await Product.findById(productId);
      } else if (slug) {
        product = await Product.findBySlug(slug);
      }

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
    } catch (err) {
      // Handle invalid ObjectId format
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Parse and validate date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Check availability
    const isAvailable = await checkProductAvailability(product, dateStr);

    // Prepare response
    const response = {
      available: isAvailable,
      product: {
        name: product.name,
        slug: product.slug,
        status: product.availability,
      },
    };

    // Add reason if not available
    if (!isAvailable) {
      Object.assign(response, {
        reason: getUnavailabilityReason(product, date),
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
