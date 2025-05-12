import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthRequest, withAuth } from "@/middleware/auth";

interface ProductQuery {
  category?: string;
  availability?: string;
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

    // Build query
    const query: ProductQuery = {};
    if (category) {
      query.category = category;
    }
    if (availability) {
      query.availability = availability;
    }

    let products;
    let total;

    // If search query is provided, use text search
    if (search) {
      products = await Product.searchProducts(search);
      total = await Product.countDocuments({ $text: { $search: search } });
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
  // Use the withAuth middleware to handle authentication
  return withAuth(request, async (authReq: AuthRequest) => {
    try {
      // Get the user from the request
      const user = authReq.user;

      // Check if user is admin
      if (user?.role !== "admin") {
        return NextResponse.json(
          { error: "Not authorized to create products" },
          { status: 403 },
        );
      }

      // Get product data
      let productData;
      try {
        // Try to get data from the request directly
        productData = await request.json();
      } catch (error) {
        // If that fails, try to use the mocked json function if available
        if (typeof (authReq as any).json === "function") {
          productData = await (authReq as any).json();
        } else {
          // If both methods fail, rethrow the error
          throw error;
        }
      }

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
  });
}
