import { Document, Model, Types } from "mongoose";

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
  user?: string; // Reference to user who created the review
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

// Add Mongoose interfaces
export interface IReview {
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
  user?: Types.ObjectId; // Reference to User model
}

export interface IReviewDocument extends IReview, Document { }

export interface IReviewModel extends Model<IReviewDocument> {
  findByReviewId(reviewId: string): Promise<IReviewDocument | null>;
  findByPlaceId(placeId: string): Promise<IReviewDocument[]>;
}
