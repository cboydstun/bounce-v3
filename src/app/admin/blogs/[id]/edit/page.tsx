"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BlogForm, { BlogFormData } from "../../BlogForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import api from "@/utils/api";
import { API_BASE_URL, API_ROUTES } from "@/config/constants";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBlog({ params }: PageProps) {
  const router = useRouter();
  const [blog, setBlog] = useState<BlogFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = React.use(params);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await api.get(
          `${API_BASE_URL}${API_ROUTES.BLOGS}/${id}`
        );
        // Ensure arrays are initialized even if null in response
        const formattedBlog: BlogFormData = {
          ...response.data,
          _id: response.data._id,
          categories: response.data.categories || [],
          tags: response.data.tags || [],
          meta: response.data.meta || {
            views: 0,
            likes: 0,
            shares: 0,
          },
          isFeature: response.data.isFeature || false,
          comments: response.data.comments || [],
          readTime: response.data.readTime || 0,
          relatedPosts: response.data.relatedPosts || [],
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          seo: response.data.seo || {
            metaTitle: "",
            metaDescription: "",
            focusKeyword: "",
          },
        };
        setBlog(formattedBlog);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

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

      await api.put(`${API_BASE_URL}${API_ROUTES.BLOGS}/${id}`, formattedData);
      router.push("/admin/blogs");
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update blog post");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-indigo-600 hover:text-indigo-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Edit Blog Post
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Make changes to the blog post below.
          </p>
        </div>
      </div>
      <div className="mt-8">
        {blog && (
          <BlogForm initialData={blog} onSubmit={handleSubmit} isEdit={true} />
        )}
      </div>
    </div>
  );
}
