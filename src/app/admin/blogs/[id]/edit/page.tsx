"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BlogForm, { BlogFormData } from "../../BlogForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { API_ROUTES } from "@/config/constants";

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
        const response = await fetch(`${API_ROUTES.BLOGS}/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch blog");
        }

        const data = await response.json();
        // Ensure arrays are initialized even if null in response
        // Format the blog data with proper defaults
        const formattedBlog: BlogFormData = {
          ...data,
          categories: data.categories || [],
          tags: data.tags || [],
          meta: data.meta || {
            views: 0,
            likes: 0,
            shares: 0,
          },
          isFeature: data.isFeature || false,
          comments: data.comments || [],
          readTime: data.readTime || 0,
          relatedPosts: data.relatedPosts || [],
          images: data.images || [],
          newImages: [],
          featuredImage: data.featuredImage || "",
          seo: data.seo || {
            metaTitle: data.title || "",
            metaDescription: data.excerpt || "",
            focusKeyword: "",
          },
          author: data.author || { _id: "", email: "" },
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
      const response = await fetch(`${API_ROUTES.BLOGS}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Send the complete images array without double stringifying
          images: [...(data.images || []), ...(data.newImages || [])],
          // Include featuredImage
          featuredImage: data.featuredImage || "",
          // Don't send newImages to the API
          newImages: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog post");
      }

      const updatedBlog = await response.json();

      // Update the form with the latest data before redirecting
      setBlog({
        ...updatedBlog,
        newImages: [], // Clear newImages after successful update
        featuredImage: updatedBlog.featuredImage || "", // Ensure featuredImage is handled
      });

      router.push("/admin/blogs");
      return updatedBlog;
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
