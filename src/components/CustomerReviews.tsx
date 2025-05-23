"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Star, Quote, ChevronRight, ChevronLeft } from "lucide-react";

import { getReviews } from "@/utils/api";
import { Review } from "@/types/review";
import StatsSection from "./StatsSection";

const CustomerReviews = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<
    Record<number, boolean>
  >({});

  // Constants for text truncation
  const MAX_CHARS = 150;

  const isTruncated = useCallback((text: string) => {
    return text.length > MAX_CHARS;
  }, []);

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedReviews((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));

      // Pause auto-rotation when a review is expanded
      if (!expandedReviews[index]) {
        setIsPaused(true);
      }
    },
    [expandedReviews],
  );

  const renderReviewText = useCallback(
    (text: string, index: number) => {
      const isExpanded = expandedReviews[index] || false;

      if (!isTruncated(text) || isExpanded) {
        return (
          <>
            {text}
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleExpand(index);
                }}
                className="text-purple-600 hover:text-purple-700 font-medium ml-2"
              >
                See Less
              </button>
            )}
          </>
        );
      }

      return (
        <>
          {text.substring(0, MAX_CHARS)}...
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleExpand(index);
            }}
            className="text-purple-600 hover:text-purple-700 font-medium ml-2"
          >
            See More
          </button>
        </>
      );
    },
    [expandedReviews, isTruncated, toggleExpand],
  );

  // Calculate review stats
  const stats = useMemo(() => {
    if (!reviews.length) return null;

    const averageRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    const satisfactionRate =
      (reviews.filter((review) => review.rating >= 4).length / reviews.length) *
      100;

    return {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      satisfactionRate: Math.round(satisfactionRate),
      roundedRating: Math.round(averageRating),
    };
  }, [reviews]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPaused && reviews.length > 0) {
      const timer = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % reviews.length);
      }, 6000); // Change review every 6 seconds

      return () => clearInterval(timer);
    }
  }, [isPaused, reviews.length]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await getReviews();

        if (!response.reviews || response.reviews.length === 0) {
          setError("No reviews available");
        } else {
          setReviews(response.reviews);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch reviews",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderMessage = (message: string, isLoading: boolean = false) => (
    <div className="w-full bg-[#663399] py-18">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className={`text-white ${isLoading ? "animate-pulse" : ""}`}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return renderMessage("Loading reviews...", true);
  }

  if (error) {
    return renderMessage(`Error: ${error}`);
  }

  if (!reviews.length) {
    return renderMessage("No reviews available yet.");
  }

  // Event handlers
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={`star-${i}`}
        className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const nextReview = () => {
    const newIndex = (activeIndex + 1) % reviews.length;
    setActiveIndex(newIndex);
    // Reset expanded state when navigating
    if (expandedReviews[activeIndex]) {
      setExpandedReviews((prev) => ({
        ...prev,
        [activeIndex]: false,
      }));
    }
  };

  const prevReview = () => {
    const newIndex = (activeIndex - 1 + reviews.length) % reviews.length;
    setActiveIndex(newIndex);
    // Reset expanded state when navigating
    if (expandedReviews[activeIndex]) {
      setExpandedReviews((prev) => ({
        ...prev,
        [activeIndex]: false,
      }));
    }
  };

  return (
    <div className="w-full bg-[#663399] py-18">
      <div className="container mx-auto px-4">
        {/* Main Stats Section */}
        {stats && <StatsSection stats={stats} />}

        {/* Featured Review Section */}
        <div
          className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                What Our Customers Say
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={prevReview}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextReview}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Next review"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Quote className="absolute text-purple-100 w-24 h-24 -left-4 -top-4" />
              <div className="relative">
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: expandedReviews[activeIndex]
                      ? "1000px"
                      : "120px",
                    minHeight: "190px",
                  }}
                >
                  <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                    {renderReviewText(reviews[activeIndex].text, activeIndex)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {reviews[activeIndex].authorName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">
                      {reviews[activeIndex].authorName}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(reviews[activeIndex].rating)}
                      <span className="text-gray-500 ml-2">
                        {reviews[activeIndex].time instanceof Date
                          ? new Date(
                              reviews[activeIndex].time,
                            ).toLocaleDateString()
                          : new Date(
                              reviews[activeIndex].time as unknown as string,
                            ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full h-1 bg-gray-100">
            <div
              className="absolute h-full bg-primary-blue transition-all duration-300"
              style={{
                width: !isPaused ? "100%" : "0%",
                transition: !isPaused ? "width 6s linear" : "none",
              }}
            />
          </div>

          <div className="bg-gray-50 p-6 flex justify-between items-center">
            <div className="text-gray-600 flex items-center gap-2">
              <span>
                Review {activeIndex + 1} of {reviews.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://g.co/kgs/Dq42aY6"
                className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
              >
                See All Reviews
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews;
