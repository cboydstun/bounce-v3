import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import Contact from "@/models/Contact";
import Settings from "@/models/Settings";
import {
  formatDateCT,
  parseDateCT,
  parseDateStartOfDayUTC,
  parseDateEndOfDayUTC,
} from "@/utils/dateUtils";

/**
 * POST /api/v1/products/batch-availability
 * Check availability for multiple products on a specific date OR multiple dates for specific products
 * Request body:
 * - productIds: Array of product IDs to check
 * - productSlugs: Array of product slugs to check (alternative to productIds)
 * - date: The date to check availability for (YYYY-MM-DD) - for single date
 * - dates: Array of dates to check availability for (YYYY-MM-DD) - for multiple dates
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Parse request body
    const {
      productIds,
      productSlugs,
      date: dateStr,
      dates: datesArray,
    } = await request.json();

    // Validate that either productIds or productSlugs is provided
    if (
      ((!productIds || !Array.isArray(productIds)) &&
        (!productSlugs || !Array.isArray(productSlugs))) ||
      (!dateStr && (!datesArray || !Array.isArray(datesArray)))
    ) {
      return NextResponse.json(
        {
          error:
            "Either product IDs or product slugs array and date/dates are required",
        },
        { status: 400 },
      );
    }

    // Determine if we're checking single date or multiple dates
    const datesToCheck =
      datesArray && Array.isArray(datesArray) ? datesArray : [dateStr];

    // Validate all dates
    const validDates = datesToCheck.map((dateStr) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
      return { dateStr, date };
    });

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

    // Get the settings including blackout dates (only need to fetch once)
    const settings = await Settings.getSettings();
    const maxDailyBookings = settings.maxDailyBookings;
    const blackoutDatesCT = settings.blackoutDates.map((d: Date) =>
      formatDateCT(new Date(d)),
    );

    // Create date ranges for all dates to check using proper UTC utilities
    const dateRanges = validDates.map(({ dateStr }) => {
      const startOfDay = parseDateStartOfDayUTC(dateStr);
      const endOfDay = parseDateEndOfDayUTC(dateStr);
      return { dateStr, startOfDay, endOfDay };
    });

    // Find the overall date range for efficient querying
    const allStartDates = dateRanges.map((r) => r.startOfDay);
    const allEndDates = dateRanges.map((r) => r.endOfDay);
    const overallStartDate = new Date(
      Math.min(...allStartDates.map((d) => d.getTime())),
    );
    const overallEndDate = new Date(
      Math.max(...allEndDates.map((d) => d.getTime())),
    );

    // Find all bookings for these products across all dates in a single query
    const allBookings = await Contact.find({
      bouncer: { $in: products.map((p) => p.name) },
      partyDate: {
        $gte: overallStartDate,
        $lte: overallEndDate,
      },
      confirmed: { $in: ["Confirmed", "Converted"] },
    });

    // Get total bookings per date across all products
    const totalBookingsPerDate = await Contact.aggregate([
      {
        $match: {
          partyDate: {
            $gte: overallStartDate,
            $lte: overallEndDate,
          },
          confirmed: { $in: ["Confirmed", "Converted"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$partyDate",
              timezone: "America/Chicago",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map of date to total bookings
    const bookingsCountByDate = totalBookingsPerDate.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Process results for each date
    const results: Record<string, any> = {};

    for (const { dateStr } of validDates) {
      // Check if this date is a blackout date
      const selectedDateCT = parseDateCT(dateStr);
      const selectedDateString = formatDateCT(selectedDateCT);
      const isBlackoutDate = blackoutDatesCT.includes(selectedDateString);

      // Get bookings for this specific date using proper UTC utilities
      const dateStart = parseDateStartOfDayUTC(dateStr);
      const dateEnd = parseDateEndOfDayUTC(dateStr);

      const bookingsForDate = allBookings.filter((booking) => {
        const bookingDate = new Date(booking.partyDate);
        return bookingDate >= dateStart && bookingDate <= dateEnd;
      });

      const bookedProducts = new Set(
        bookingsForDate.map((booking) => booking.bouncer),
      );
      const totalBookingsForDate = bookingsCountByDate[selectedDateString] || 0;
      const dateAtCapacity = totalBookingsForDate >= maxDailyBookings;

      // If it's a blackout date, mark all products as unavailable
      if (isBlackoutDate) {
        (products as ProductDocument[]).forEach((product) => {
          const key = datesArray
            ? `${product._id.toString()}_${dateStr}`
            : product._id.toString();
          results[key] = {
            available: false,
            product: {
              name: product.name,
              slug: product.slug,
              status: product.availability,
            },
            reason: "This date is unavailable for booking (blackout date)",
            date: dateStr,
          };
        });
      } else {
        // Process each product for this date
        (products as ProductDocument[]).forEach((product) => {
          const isProductAvailable =
            product.availability === "available" &&
            !bookedProducts.has(product.name);

          const isAvailable = isProductAvailable && !dateAtCapacity;
          const key = datesArray
            ? `${product._id.toString()}_${dateStr}`
            : product._id.toString();

          results[key] = {
            available: isAvailable,
            product: {
              name: product.name,
              slug: product.slug,
              status: product.availability,
            },
            date: dateStr,
          };

          // Add reason if not available
          if (!isAvailable) {
            if (dateAtCapacity && isProductAvailable) {
              results[key].reason =
                `Maximum bookings reached for this date (${totalBookingsForDate}/${maxDailyBookings})`;
            } else {
              results[key].reason =
                product.availability !== "available"
                  ? `Product is currently ${product.availability}`
                  : "Product is already booked for this date";
            }
          }
        });
      }

      // Add metadata for each date
      const metaKey = datesArray ? `_meta_${dateStr}` : "_meta";
      results[metaKey] = {
        isBlackoutDate,
        dateAtCapacity,
        totalBookings: totalBookingsForDate,
        maxBookings: maxDailyBookings,
        date: dateStr,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error checking batch availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
