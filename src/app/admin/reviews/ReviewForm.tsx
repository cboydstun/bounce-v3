"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import api from "@/utils/api";
import { API_ROUTES } from "@/config/constants";
import {
  ReviewFormData,
  CreateReviewData,
  UpdateReviewData,
  urlRegex,
  languageRegex,
} from "@/types/review";

interface ReviewFormProps {
  initialData?: ReviewFormData & { _id?: string };
  isEditing?: boolean;
}

export default function ReviewForm({
  initialData,
  isEditing = false,
}: ReviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ReviewFormData>(
    initialData ?? {
      placeId: "main",
      authorName: "",
      rating: 5,
      text: "",
      isLocalGuide: false,
      likes: 0,
      authorUrl: "",
      profilePhotoUrl: "",
      language: "en",
      relativeTimeDescription: "",
    },
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.authorUrl && !urlRegex.test(formData.authorUrl)) {
      newErrors.authorUrl = "Please enter a valid URL";
    }

    if (formData.profilePhotoUrl && !urlRegex.test(formData.profilePhotoUrl)) {
      newErrors.profilePhotoUrl = "Please enter a valid URL";
    }

    if (formData.language && !languageRegex.test(formData.language)) {
      newErrors.language = "Please enter a valid language code (e.g., en-US)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData?._id) {
        const updateData: UpdateReviewData = {
          ...formData,
          reviewId: initialData.reviewId || `review_${Date.now()}`,
          likes: formData.likes || 0,
        };
        await api.put(`${API_ROUTES.REVIEWS}/${initialData._id}`, updateData);
      } else {
        const createData: CreateReviewData = {
          ...formData,
          reviewId: `review_${Date.now()}`,
          likes: 0,
        };
        await api.post(API_ROUTES.REVIEWS, createData);
      }
      router.push("/admin/reviews");
      router.refresh();
    } catch (error) {
      console.error("Failed to save review:", error);
      alert("Failed to save review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => (
      <button
        key={index}
        type="button"
        onClick={() => setFormData((prev) => ({ ...prev, rating: index + 1 }))}
        className="focus:outline-none"
      >
        <Star
          className={`w-8 h-8 ${
            index < formData.rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      </button>
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <label
            htmlFor="authorName"
            className="block text-sm font-medium text-gray-700"
          >
            Author Name
          </label>
          <input
            type="text"
            name="authorName"
            id="authorName"
            required
            value={formData.authorName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="authorUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Author URL
          </label>
          <input
            type="text"
            name="authorUrl"
            id="authorUrl"
            value={formData.authorUrl || ""}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.authorUrl ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.authorUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.authorUrl}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="profilePhotoUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Profile Photo URL
          </label>
          <input
            type="text"
            name="profilePhotoUrl"
            id="profilePhotoUrl"
            value={formData.profilePhotoUrl || ""}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.profilePhotoUrl ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.profilePhotoUrl && (
            <p className="mt-1 text-sm text-red-600">
              {errors.profilePhotoUrl}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700"
          >
            Language Code
          </label>
          <input
            type="text"
            name="language"
            id="language"
            value={formData.language || ""}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.language ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="en-US"
          />
          {errors.language && (
            <p className="mt-1 text-sm text-red-600">{errors.language}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rating
        </label>
        <div className="mt-1 flex gap-1">{renderStars()}</div>
      </div>

      <div>
        <label
          htmlFor="text"
          className="block text-sm font-medium text-gray-700"
        >
          Review Text
        </label>
        <textarea
          name="text"
          id="text"
          required
          rows={4}
          value={formData.text}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isLocalGuide"
          id="isLocalGuide"
          checked={formData.isLocalGuide}
          onChange={handleInputChange}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label
          htmlFor="isLocalGuide"
          className="ml-2 block text-sm text-gray-700"
        >
          Is Local Guide
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Update Review"
              : "Create Review"}
        </button>
      </div>
    </form>
  );
}
