"use client";

import ReviewForm from "../ReviewForm";

export default function NewReview() {
  return (
    <div>
      <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-8">
        Add New Review
      </h1>
      <ReviewForm />
    </div>
  );
}
