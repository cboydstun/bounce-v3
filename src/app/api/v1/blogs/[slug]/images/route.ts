import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import { Blog, User } from "@/models"; // Import from central models file
import { withAuth, AuthRequest } from "@/middleware/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  return withAuth(request, async (req: AuthRequest) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return NextResponse.json(
          { error: "Not authorized to upload images" },
          { status: 403 },
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
          { error: "Not authorized to upload images to this blog" },
          { status: 403 },
        );
      }

      // Parse form data
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 },
        );
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudinary
      const uploadResult = await uploadImage(buffer, `blogs/${blog._id}`);

      // Add image to blog
      const image = {
        filename: uploadResult.filename,
        url: uploadResult.url,
        public_id: uploadResult.public_id,
        mimetype: file.type,
        size: file.size,
      };

      blog.images.push(image);
      await blog.save();

      return NextResponse.json(image, { status: 201 });
    } catch (error) {
      console.error("Error uploading image:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }
  });
}
