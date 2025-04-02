import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import { Blog, User } from "@/models"; // Import from central models file
import { withAuth, AuthRequest } from "@/middleware/auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await dbConnect();

    // Await the params object to get the slug
    const { slug } = await params;

    let blog;

    // Check if slug is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(slug)) {
      blog = await Blog.findById(slug).populate("author", "name");
    } else {
      // If not a valid ObjectId, try to find by slug
      blog = await Blog.findBySlug(slug);
    }

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Increment view count
    blog.meta.views += 1;
    await blog.save();

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  return withAuth(request, async (req: AuthRequest) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return NextResponse.json(
          { error: "Not authorized to update blogs" },
          { status: 403 },
        );
      }

      await dbConnect();

      // Await the params object to get the slug
      const { slug } = await params;

      // Find the blog
      let blog;

      // Check if slug is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(slug)) {
        blog = await Blog.findById(slug);
      } else {
        // If not a valid ObjectId, try to find by slug
        blog = await Blog.findOne({ slug });
      }

      if (!blog) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }

      // Check if user is authorized to update this blog
      const authorId = blog.author.toString();
      const userId = req.user.id.toString();

      if (authorId !== userId && req.user.role !== "admin") {
        return NextResponse.json(
          { error: "Not authorized to update this blog" },
          { status: 403 },
        );
      }

      // Get blog data from request
      const blogData = await req.json();

      // Set publish date if status is changing to published
      if (blogData.status === "published" && blog.status !== "published") {
        blogData.publishDate = new Date().toISOString();
      }

      // Update blog
      const updatedBlog = await Blog.findByIdAndUpdate(
        blog._id,
        { $set: blogData },
        { new: true, runValidators: true },
      ).populate("author", "name");

      return NextResponse.json(updatedBlog);
    } catch (error) {
      console.error("Error updating blog:", error);
      return NextResponse.json(
        { error: "Failed to update blog" },
        { status: 500 },
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  return withAuth(request, async (req: AuthRequest) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return NextResponse.json(
          { error: "Not authorized to delete blogs" },
          { status: 403 },
        );
      }

      await dbConnect();

      // Await the params object to get the slug
      const { slug } = await params;

      // Find the blog
      let blog;

      // Check if slug is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(slug)) {
        blog = await Blog.findById(slug);
      } else {
        // If not a valid ObjectId, try to find by slug
        blog = await Blog.findOne({ slug });
      }

      if (!blog) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }

      // Check if user is authorized to delete this blog
      const authorId = blog.author.toString();
      const userId = req.user.id.toString();

      if (authorId !== userId && req.user.role !== "admin") {
        return NextResponse.json(
          { error: "Not authorized to delete this blog" },
          { status: 403 },
        );
      }

      // Delete blog
      await Blog.findByIdAndDelete(blog._id);

      return NextResponse.json({ message: "Blog deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog:", error);
      return NextResponse.json(
        { error: "Failed to delete blog" },
        { status: 500 },
      );
    }
  });
}
