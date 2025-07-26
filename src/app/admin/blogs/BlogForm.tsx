"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Blog } from "@/types/blog";
import { API_BASE_URL, API_ROUTES } from "@/config/constants";
import { CldUploadButton } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";

// Extend the Blog type with form-specific fields
export interface BlogFormData
  extends Omit<Blog, "_id" | "publishDate" | "lastModified"> {
  author: {
    _id: string;
    email: string;
  };
  publishDate?: Date;
  lastModified?: Date;
  isFeature: boolean;
  comments?: Array<{
    user: string;
    content: string;
    date: Date;
    isApproved: boolean;
  }>;
  relatedPosts?: Array<{
    _id: string;
    title: string;
    slug: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  newImages?: Array<{
    filename: string;
    url: string;
    public_id: string;
    mimetype?: string;
    size?: number;
  }>;
}

interface BlogFormProps {
  initialData?: BlogFormData;
  onSubmit: (data: BlogFormData) => Promise<Blog>;
  isEdit?: boolean;
}

export default function BlogForm({
  initialData,
  onSubmit,
  isEdit = false,
}: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>(
    initialData || {
      title: "",
      slug: "",
      author: {
        _id: "",
        email: "",
      },
      introduction: "",
      body: "",
      conclusion: "",
      images: [],
      excerpt: "",
      featuredImage: "",
      categories: [],
      tags: [],
      status: "draft",
      publishDate: undefined,
      lastModified: undefined,
      comments: [],
      meta: {
        views: 0,
        likes: 0,
        shares: 0,
      },
      seo: {
        metaTitle: "",
        metaDescription: "",
        focusKeyword: "",
      },
      readTime: 0,
      isFeature: false,
      relatedPosts: [],
      createdAt: undefined,
      updatedAt: undefined,
      newImages: [],
    },
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Create a complete blog data object, preserving all images
      const blogData: BlogFormData = {
        ...formData,
        // Keep images and newImages separate until API call
        images: formData.images || [],
        newImages: formData.newImages || [],
      };

      // Send the data to be handled by the parent component
      const updatedBlog = await onSubmit(blogData);

      // Update form data with the new blog data
      if (updatedBlog) {
        setFormData((prev) => ({
          ...prev,
          images: updatedBlog.images || [], // Use new images from response
          newImages: [], // Clear newImages after successful submission
          featuredImage: updatedBlog.featuredImage || prev.featuredImage, // Preserve featured image
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while saving",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageDelete = async (image: BlogFormData["images"][0]) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.BLOGS}/${formData.slug}/images/${image.filename}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // If the deleted image was the featured image, clear it
      const updatedFormData = {
        ...formData,
        images: formData.images.filter(
          (img) => img.filename !== image.filename,
        ),
      };

      if (formData.featuredImage === image.url) {
        updatedFormData.featuredImage = "";
      }

      setFormData(updatedFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Title
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Slug
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="author"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Author Email
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="author"
            value={formData.author?.email || "No author assigned"}
            disabled
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="introduction"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Introduction
        </label>
        <div className="mt-2">
          <textarea
            id="introduction"
            rows={3}
            value={formData.introduction}
            onChange={(e) =>
              setFormData({ ...formData, introduction: e.target.value })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Body
        </label>
        <div className="mt-2">
          <textarea
            id="body"
            rows={10}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="conclusion"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Conclusion
        </label>
        <div className="mt-2">
          <textarea
            id="conclusion"
            rows={3}
            value={formData.conclusion}
            onChange={(e) =>
              setFormData({ ...formData, conclusion: e.target.value })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Featured Image
        </label>
        <div className="mt-2">
          {formData.featuredImage ? (
            <div className="relative w-full max-w-md">
              <Image
                src={formData.featuredImage}
                alt="Featured"
                width={400}
                height={192}
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, featuredImage: "" })}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No featured image selected</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Current Images
        </label>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {formData.images.map((image) => (
            <div key={image.public_id} className="relative group">
              <div className="relative">
                <Image
                  src={image.url}
                  alt={image.filename}
                  width={300}
                  height={128}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {formData.featuredImage !== image.url && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, featuredImage: image.url })
                    }
                    className="absolute bottom-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Set as Featured
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleImageDelete(image)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {formData.newImages && formData.newImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900">
            New Images (will be saved when you submit)
          </label>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {formData.newImages.map((image, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="relative">
                  <Image
                    src={image.url}
                    alt={image.filename}
                    width={300}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                  />
                  {formData.featuredImage !== image.url && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, featuredImage: image.url })
                      }
                      className="absolute bottom-2 left-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Set as Featured
                    </button>
                  )}
                  <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                    New
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      newImages:
                        prev.newImages?.filter((_, i) => i !== index) || [],
                      // If this was the featured image, clear it
                      featuredImage:
                        prev.featuredImage === image.url
                          ? ""
                          : prev.featuredImage,
                    }));
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900">
          Upload Images
        </label>
        <div className="mt-2">
          <CldUploadButton
            onSuccess={(result: CloudinaryUploadWidgetResults) => {
              if (result.info && typeof result.info !== "string") {
                const info = result.info;
                const newImage = {
                  filename:
                    info.original_filename ||
                    info.public_id.split("/").pop() ||
                    "",
                  url: info.secure_url,
                  public_id: info.public_id,
                  mimetype: info.format ? `image/${info.format}` : undefined,
                  size: info.bytes || 0,
                };

                setFormData((prev) => ({
                  ...prev,
                  newImages: [...(prev.newImages || []), newImage],
                  // If no featured image is set, use this as featured image
                  featuredImage: prev.featuredImage || newImage.url,
                }));
              }
            }}
            uploadPreset="satxbounce-blogs"
            options={{
              maxFiles: 5,
              resourceType: "image",
              clientAllowedFormats: ["jpg", "jpeg", "png", "gif"],
              maxFileSize: 5000000,
            }}
            className="block w-full text-sm text-gray-500
              py-2 px-4
              rounded-md border-0
              text-sm font-semibold
              bg-indigo-600 text-white
              hover:bg-indigo-500
              cursor-pointer"
          >
            Upload Images
          </CldUploadButton>
        </div>
      </div>

      <div>
        <label
          htmlFor="categories"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Categories (comma-separated)
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="categories"
            value={formData.categories.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                categories: e.target.value.split(",").map((cat) => cat.trim()),
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Tags (comma-separated)
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="tags"
            value={formData.tags.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                tags: e.target.value.split(",").map((tag) => tag.trim()),
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Status
        </label>
        <div className="mt-2">
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "draft" | "published" | "archived",
              })
            }
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="isFeature"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Featured Post
        </label>
        <div className="mt-2">
          <input
            type="checkbox"
            id="isFeature"
            checked={formData.isFeature}
            onChange={(e) =>
              setFormData({ ...formData, isFeature: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
      </div>

      <div className="flex justify-end gap-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {isLoading ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : isEdit ? (
            "Update Blog Post"
          ) : (
            "Create Blog Post"
          )}
        </button>
      </div>
    </form>
  );
}
