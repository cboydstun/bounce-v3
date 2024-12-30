"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronRight, ChevronLeft } from "lucide-react";

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  photoUrl?: string;
}

const CustomerReviews = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const reviews: Review[] = [
    {
      id: "1",
      author: "Sarah Johnson",
      rating: 5,
      comment:
        "Amazing service! The bounce house was clean, delivered on time, and the kids had a blast. Will definitely use again for our next party!",
      date: "2024-03-15",
    },
    {
      id: "2",
      author: "Michael Rodriguez",
      rating: 5,
      comment:
        "Professional service from start to finish. Setup and takedown were quick and efficient. Great value for money!",
      date: "2024-03-10",
    },
    {
      id: "3",
      author: "Amanda Chen",
      rating: 5,
      comment:
        "Used SATX Bounce for my son's birthday. The equipment was in perfect condition and the staff was very helpful with all my questions.",
      date: "2024-03-05",
    },
  ];

  // Auto-advance timer
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % reviews.length);
      }, 2000); // Change review every 6 seconds

      return () => clearInterval(timer);
    }
  }, [isPaused, reviews.length]);

  // Add these handlers to the main review container
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={`star-${i}`}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const nextReview = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div className="w-full bg-[#663399] py-18">
      <div className="container mx-auto px-4">
        {/* Main Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-5xl font-bold text-white mb-2">5.0</div>
            <div className="flex justify-center mb-3">{renderStars(5)}</div>
            <div className="text-white/90">Overall Rating</div>
          </div>

          <div className="bg-white/10 backdrop-blur p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-5xl font-bold text-white mb-2">72</div>
            <div className="text-yellow-400 text-xl mb-3">★</div>
            <div className="text-white/90">Verified Reviews</div>
          </div>

          <div className="bg-white/10 backdrop-blur p-8 rounded-2xl text-center transform hover:scale-105 transition-all duration-300">
            <div className="text-5xl font-bold text-white mb-2">100%</div>
            <div className="text-yellow-400 text-xl mb-3">★</div>
            <div className="text-white/90">Satisfaction Rate</div>
          </div>
        </div>

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
                <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                  {reviews[activeIndex].comment}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {reviews[activeIndex].author[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">
                      {reviews[activeIndex].author}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(reviews[activeIndex].rating)}
                      <span className="text-gray-500 ml-2">
                        {new Date(
                          reviews[activeIndex].date
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
                transition: !isPaused ? "width 2s linear" : "none",
              }}
            />
          </div>

          <div className="bg-gray-50 p-6 flex justify-between items-center">
            <div className="text-gray-600">
              Verified Google Review {activeIndex + 1} of {reviews.length}
            </div>
            <a
              href="https://google.com/our-reviews"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              View All Reviews
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews;
