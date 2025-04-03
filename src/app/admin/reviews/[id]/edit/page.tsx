"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ReviewForm from "../../ReviewForm";
import { Review } from "@/types/review";
import { getReviewById } from "@/utils/api";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[REVIEW EDIT PAGE DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

export default function EditReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = React.use(params);

  // Check authentication using NextAuth.js
  useEffect(() => {
    debugLog("Authentication check", { status, hasSession: !!session });

    if (status === "loading") {
      // Still loading session, wait
      return;
    }

    if (status === "unauthenticated") {
      debugLog("User not authenticated, redirecting to login");
      router.push("/login");
    }
  }, [status, session, router]);

  useEffect(() => {
    // Only fetch review if authenticated
    if (status !== "authenticated") return;

    const fetchReview = async () => {
      try {
        debugLog("Fetching review", { id });
        setIsLoading(true);
        setError(null);

        // Use the API utility function instead of direct fetch
        const data = await getReviewById(id);
        debugLog("Review fetched successfully", { reviewId: data._id });
        setReview(data);
      } catch (error) {
        // Handle authentication errors
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Authentication failed"))
        ) {
          debugLog("Authentication error in fetchReview");
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        debugLog("Error fetching review", { error });
        console.error("Error fetching review:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [id, router, status]);

  if (status === "loading" || isLoading) {
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
