import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import { Blog, User } from "@/models"; // Import from central models file
import { withAuth, AuthRequest } from "@/middleware/auth";
import { deleteImage } from "@/lib/cloudinary";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { slug: string; filename: string } }
) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return NextResponse.json(
                    { error: "Not authorized to delete images" },
                    { status: 403 }
                );
            }

            await dbConnect();

            // Find the blog by slug
            const blog = await Blog.findBySlug(params.slug);

            if (!blog) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            // Check if user is authorized to update this blog
            const authorId = blog.author.toString();
            const userId = req.user.id.toString();

            if (authorId !== userId && req.user.role !== "admin") {
                return NextResponse.json(
                    { error: "Not authorized to delete images from this blog" },
                    { status: 403 }
                );
            }

            // Find the image in the blog
            const imageIndex = blog.images.findIndex(
                (img) => img.filename === params.filename || img.public_id === params.filename
            );

            if (imageIndex === -1) {
                return NextResponse.json({ error: "Image not found" }, { status: 404 });
            }

            const image = blog.images[imageIndex];

            // Delete from Cloudinary
            await deleteImage(image.public_id);

            // Remove image from blog
            blog.images.splice(imageIndex, 1);
            await blog.save();

            return NextResponse.json({ message: "Image deleted successfully" });
        } catch (error) {
            console.error("Error deleting image:", error);
            return NextResponse.json(
                { error: "Failed to delete image" },
                { status: 500 }
            );
        }
    });
}
