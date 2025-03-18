import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Review from "@/models/Review";
import { withAuth, AuthRequest } from "@/middleware/auth";
import mongoose from "mongoose";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const resolvedParams = await params;
        const review = await Review.findById(resolvedParams.id).populate("user", "email");

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        return NextResponse.json(review);
    } catch (error) {
        console.error("Error fetching review:", error);
        return NextResponse.json(
            { error: "Failed to fetch review" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            await dbConnect();

            const reviewData = await req.json();
            const resolvedParams = await params;

            // Find the review
            const review = await Review.findById(resolvedParams.id);

            if (!review) {
                return NextResponse.json(
                    { error: "Review not found" },
                    { status: 404 }
                );
            }

            // Check if user is authorized to update this review
            if (
                review.user &&
                req.user &&
                review.user.toString() !== req.user.id &&
                req.user.role !== "admin"
            ) {
                return NextResponse.json(
                    { error: "Not authorized to update this review" },
                    { status: 403 }
                );
            }

            // Update review
            const updatedReview = await Review.findByIdAndUpdate(
                resolvedParams.id,
                { $set: reviewData },
                { new: true, runValidators: true }
            );

            return NextResponse.json(updatedReview);
        } catch (error) {
            console.error("Error updating review:", error);

            // Handle validation errors
            if (error instanceof mongoose.Error.ValidationError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: "Failed to update review" },
                { status: 500 }
            );
        }
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            await dbConnect();
            const resolvedParams = await params;

            // Find the review
            const review = await Review.findById(resolvedParams.id);

            if (!review) {
                return NextResponse.json(
                    { error: "Review not found" },
                    { status: 404 }
                );
            }

            // Check if user is authorized to delete this review
            if (
                review.user &&
                req.user &&
                review.user.toString() !== req.user.id &&
                req.user.role !== "admin"
            ) {
                return NextResponse.json(
                    { error: "Not authorized to delete this review" },
                    { status: 403 }
                );
            }

            // Delete review
            await Review.findByIdAndDelete(resolvedParams.id);

            return NextResponse.json({ message: "Review deleted successfully" });
        } catch (error) {
            console.error("Error deleting review:", error);
            return NextResponse.json(
                { error: "Failed to delete review" },
                { status: 500 }
            );
        }
    });
}
