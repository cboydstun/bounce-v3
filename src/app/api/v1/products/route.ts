import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";

interface ProductQuery {
  category?: string;
  availability?: string | { $ne: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // For potential future query parameters, though ideally this would be more specific
}

/**
 * GET /api/v1/products
 * Retrieve all products with filtering (no pagination)
 * This endpoint is public and does not require authentication
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Parse query parameters
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const availability = url.searchParams.get("availability");
    const includeRetired = url.searchParams.get("includeRetired") === "true";

    // Build query - exclude retired products by default for public consumption
    const query: ProductQuery = {};

    // Only exclude retired products if includeRetired is not true
    if (!includeRetired) {
      query.availability = { $ne: "retired" };
    }

    if (category) {
      query.category = category;
    }
    if (availability) {
      // If availability is specifically requested, override the default exclusion
      query.availability = availability;
    }

    let products;
    let total;

    // If search query is provided, use text search
    if (search) {
      // Build search query
      const searchQuery: any = {
        $text: { $search: search },
      };

      // Only exclude retired products if includeRetired is not true
      if (!includeRetired) {
        searchQuery.availability = { $ne: "retired" };
      }

      // If availability is specifically requested, override the default exclusion
      if (availability) {
        searchQuery.availability = availability;
      }

      products = await Product.find(searchQuery, {
        score: { $meta: "textScore" },
      }).sort({ score: { $meta: "textScore" } });
      total = await Product.countDocuments(searchQuery);
    } else {
      // Otherwise, use regular query
      products = await Product.find(query).sort({ createdAt: -1 });
      total = await Product.countDocuments(query);
    }

    return NextResponse.json({
      products,
      total,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/products
 * Create a new product (admin only)
 * This endpoint requires authentication and admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Import NextAuth dependencies only when needed
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

    // Get the session using NextAuth.js
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get product data from request
    const productData = await request.json();

    await dbConnect();

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "category",
      "price",
      "rentalDuration",
      "dimensions",
      "capacity",
      "ageRange",
      "setupRequirements",
      "features",
      "safetyGuidelines",
    ];

    const missingFields = requiredFields.filter((field) => {
      if (field === "price") {
        return !productData.price || !productData.price.base;
      }
      if (field === "dimensions") {
        return (
          !productData.dimensions ||
          !productData.dimensions.length ||
          !productData.dimensions.width ||
          !productData.dimensions.height
        );
      }
      if (field === "ageRange") {
        return (
          !productData.ageRange ||
          productData.ageRange.min === undefined ||
          productData.ageRange.max === undefined
        );
      }

      if (field === "setupRequirements") {
        return (
          !productData.setupRequirements ||
          !productData.setupRequirements.space ||
          !productData.setupRequirements.surfaceType
        );
      }
      return !productData[field];
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Create product
    const product = await Product.create(productData);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
