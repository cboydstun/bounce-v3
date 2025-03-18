import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import { Blog, User } from "@/models"; // Import from central models file
import { withAuth, AuthRequest } from "@/middleware/auth";
import mongoose from "mongoose";

// Define a type for the blog query
interface BlogQuery {
    status?: string;
    $text?: { $search: string };
    categories?: string;
    tags?: string;
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Parse query parameters
        const url = new URL(request.url);
        const category = url.searchParams.get("category");
        const tag = url.searchParams.get("tag");
        const search = url.searchParams.get("search");
        const status = url.searchParams.get("status");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const page = parseInt(url.searchParams.get("page") || "1");
        const skip = (page - 1) * limit;

        let blogs;
        let total;

        // Build query based on parameters
        if (search) {
            // Search by text
            blogs = await Blog.searchBlogs(search)
                .skip(skip)
                .limit(limit)
                .populate("author", "name");

            total = await Blog.countDocuments({
                $text: { $search: search },
                status: status || "published",
            });
        } else if (category) {
            // Filter by category
            blogs = await Blog.findByCategory(category)
                .skip(skip)
                .limit(limit)
                .populate("author", "name");

            total = await Blog.countDocuments({
                categories: category,
                status: status || "published",
            });
        } else if (tag) {
            // Filter by tag
            blogs = await Blog.findByTag(tag)
                .skip(skip)
                .limit(limit)
                .populate("author", "name");

            total = await Blog.countDocuments({
                tags: tag,
                status: status || "published",
            });
        } else {
            // Default query
            const query: BlogQuery = {};

            // Only filter by status if it's not 'all'
            if (status && status !== 'all') {
                query.status = status;
            } else if (!status) {
                query.status = "published"; // Default to published blogs if no status specified
            }
            // If status is 'all', don't add a status filter to the query

            console.log("Query:", query); // Log the query for debugging

            blogs = await Blog.find(query)
                .sort({ publishDate: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "name");

            total = await Blog.countDocuments(query);
        }

        return NextResponse.json({
            blogs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return NextResponse.json(
            { error: "Failed to fetch blogs" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthRequest) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return NextResponse.json(
                    { error: "Unauthorized - Invalid token" },
                    { status: 401 }
                );
            }

            await dbConnect();

            // Parse form data
            const blogData = await req.json();

            // Validate required fields
            const requiredFields = ["title", "introduction", "body", "conclusion"];
            const missingFields = requiredFields.filter((field) => !blogData[field]);

            if (missingFields.length > 0) {
                return NextResponse.json(
                    { error: `Missing required fields: ${missingFields.join(", ")}` },
                    { status: 400 }
                );
            }

            // Set author to current user
            blogData.author = req.user.id;

            // Set publish date if status is published
            if (blogData.status === "published" && !blogData.publishDate) {
                blogData.publishDate = new Date().toISOString();
            }

            // Create blog
            const blog = await Blog.create(blogData);

            return NextResponse.json(blog, { status: 201 });
        } catch (error) {
            console.error("Error creating blog:", error);
            return NextResponse.json(
                {
                    error: "Failed to create blog",
                    details: error instanceof Error ? error.message : String(error)
                },
                { status: 500 }
            );
        }
    });
}
