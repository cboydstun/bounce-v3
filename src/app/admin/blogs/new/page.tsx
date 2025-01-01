"use client";

import { useRouter } from "next/navigation";
import BlogForm, { BlogFormData } from "../BlogForm";
import api from "@/utils/api";
import { API_BASE_URL, API_ROUTES } from "@/config/constants";

export default function NewBlog() {
  const router = useRouter();

  const handleSubmit = async (data: BlogFormData) => {
    try {
      // Convert arrays to comma-separated strings
      const formattedData = {
        ...data,
        categories: Array.isArray(data.categories)
          ? data.categories.join(",")
          : data.categories,
        tags: Array.isArray(data.tags) ? data.tags.join(",") : data.tags,
      };

      await api.post(`${API_BASE_URL}${API_ROUTES.BLOGS}`, formattedData);
      router.push("/admin/blogs");
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
