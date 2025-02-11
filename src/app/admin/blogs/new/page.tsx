"use client";

import { useRouter } from "next/navigation";
import BlogForm, { BlogFormData } from "../BlogForm";
import { API_BASE_URL, API_ROUTES } from "@/config/constants";
import { Blog } from "@/types/blog";

export default function NewBlog() {
  const router = useRouter();

  const handleSubmit = async (data: BlogFormData): Promise<Blog> => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ROUTES.BLOGS}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Ensure we're sending the complete images array
          images: [...(data.images || [])],
          // Include featuredImage
          featuredImage: data.featuredImage || "",
          // Don't send newImages to the API
          newImages: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create blog post");
      }

      const savedBlog = await response.json();
      router.push("/admin/blogs");
      return savedBlog;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create blog post");
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Create New Blog Post
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Fill in the details below to create a new blog post.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <BlogForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
