export interface Review {
  _id: string;
  placeId: string;
  reviewId: string;
  authorName: string;
  authorUrl?: string;
  profilePhotoUrl?: string;
  rating: number;
  text: string;
  relativeTimeDescription?: string;
  language?: string;
  time: Date;
  likes: number;
  isLocalGuide: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base type with common fields
interface BaseReview {
  placeId: string;
  authorName: string;
  authorUrl?: string;
  profilePhotoUrl?: string;
  rating: number;
  text: string;
  relativeTimeDescription?: string;
  language?: string;
  isLocalGuide: boolean;
}

// Type for creating a new review
export interface CreateReviewData extends BaseReview {
  reviewId?: string; // Optional when creating
  likes?: number; // Optional when creating
}

// Type for updating an existing review
export interface UpdateReviewData extends BaseReview {
  reviewId: string; // Required when updating
  likes: number; // Required when updating
}

// Type for form data that can be used for both create and update
export type ReviewFormData = CreateReviewData;

export const urlRegex =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
export const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
