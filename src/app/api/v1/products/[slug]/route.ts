import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Product from "@/models/Product";
import { withAuth, AuthRequest } from "@/middleware/auth";

/**
 * GET /api/v1/products/[slug]
 * Retrieve a specific product by slug
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
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
            { status: 500 }
        );
    }
}

/**
 * PUT /api/v1/products/[slug]
 * Update a product by slug (admin only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is admin
            if (req.user?.role !== "admin") {
                return NextResponse.json(
                    { error: "Not authorized to update products" },
                    { status: 403 }
                );
            }

            await dbConnect();

            const productData = await req.json();
            const resolvedParams = await params;

            // Find the product
            const product = await Product.findBySlug(resolvedParams.slug);

            if (!product) {
                return NextResponse.json(
                    { error: "Product not found" },
                    { status: 404 }
                );
            }

            // Update product
            const updatedProduct = await Product.findByIdAndUpdate(
                product._id,
                { $set: productData },
                { new: true, runValidators: true }
            );

            return NextResponse.json(updatedProduct);
        } catch (error) {
            console.error("Error updating product:", error);
            return NextResponse.json(
                { error: "Failed to update product" },
                { status: 500 }
            );
        }
    });
}

/**
 * DELETE /api/v1/products/[slug]
 * Delete a product by slug (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is admin
            if (req.user?.role !== "admin") {
                return NextResponse.json(
                    { error: "Not authorized to delete products" },
                    { status: 403 }
                );
            }

            await dbConnect();
            const resolvedParams = await params;

            // Find the product
            const product = await Product.findBySlug(resolvedParams.slug);

            if (!product) {
                return NextResponse.json(
                    { error: "Product not found" },
                    { status: 404 }
                );
            }

            // Delete product
            await Product.findByIdAndDelete(product._id);

            return NextResponse.json({ message: "Product deleted successfully" });
        } catch (error) {
            console.error("Error deleting product:", error);
            return NextResponse.json(
                { error: "Failed to delete product" },
                { status: 500 }
            );
        }
    });
}
