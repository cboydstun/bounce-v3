import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import { Blog, User } from "@/models"; // Import from central models file
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { deleteImage } from "@/lib/cloudinary";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; filename: string } },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authorized to delete images" },
        { status: 401 },
      );
    }

    // Validate that we have a proper user ID
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User session is invalid - missing user ID" },
        { status: 401 },
      );
    }

    // Validate that the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "User session is invalid - invalid user ID format" },
        { status: 401 },
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
    const userId = session.user.id.toString();

    if (authorId !== userId && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized to delete images from this blog" },
        { status: 403 },
      );
    }

    // Find the image in the blog
    const imageIndex = blog.images.findIndex(
      (img) =>
        img.filename === params.filename || img.public_id === params.filename,
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
      { status: 500 },
    );
  }
}
