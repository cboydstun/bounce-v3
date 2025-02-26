"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ReviewForm from "../../ReviewForm";
import { Review } from "@/types/review";
import { API_ROUTES } from "@/config/constants";

export default function EditReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = React.use(params);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${API_ROUTES.REVIEWS}/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch review");
        }

        const data = await response.json();
        setReview(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching review:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">Error: {error}</div>;
  }

  if (!review) {
    return (
      <div className="text-gray-500 text-center py-12">Review not found</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-8">
        Edit Review
      </h1>
      <ReviewForm initialData={review} isEditing={true} />
    </div>
  );
}
