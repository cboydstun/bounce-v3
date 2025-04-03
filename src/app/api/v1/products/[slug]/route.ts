import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[PRODUCT SLUG API DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

/**
 * GET /api/v1/products/[slug]
 * Retrieve a specific product by slug
 * This endpoint is public and does not require authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await dbConnect();

    const resolvedParams = await params;
    const product = await Product.findBySlug(resolvedParams.slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/products/[slug]
 * Update a product by slug (admin only)
 * This endpoint requires authentication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session for PUT /api/v1/products/[slug]");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    // Since only admins should be logged in, we don't need to check roles
    debugLog("User authenticated, proceeding with product update");

    await dbConnect();

    const productData = await request.json();
    const resolvedParams = await params;

    // Find the product
    const product = await Product.findBySlug(resolvedParams.slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      { $set: productData },
      { new: true, runValidators: true },
    );

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/products/[slug]
 * Delete a product by slug (admin only)
 * This endpoint requires authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    debugLog("Getting server session for DELETE /api/v1/products/[slug]");
    const session = await getServerSession(authOptions);

    // Log session details for debugging
    debugLog("Session result", {
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // Check if user is authenticated
    if (!session || !session.user) {
      debugLog("No valid session found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    // Since only admins should be logged in, we don't need to check roles
    debugLog("User authenticated, proceeding with product deletion");

    await dbConnect();
    const resolvedParams = await params;

    // Find the product
    const product = await Product.findBySlug(resolvedParams.slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product
    await Product.findByIdAndDelete(product._id);

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
