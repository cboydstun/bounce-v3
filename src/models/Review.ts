import mongoose, { Schema } from "mongoose";
import { IReviewDocument, IReviewModel, urlRegex, languageRegex } from "../types/review";

const ReviewSchema = new Schema<IReviewDocument, IReviewModel>(
    {
        placeId: {
            type: String,
            required: [true, "Place ID is required"],
            index: true,
        },
        reviewId: {
            type: String,
            required: [true, "Review ID is required"],
            unique: true,
            index: true,
        },
        authorName: {
            type: String,
            required: [true, "Author name is required"],
            trim: true,
        },
        authorUrl: {
            type: String,
            validate: {
                validator: function (v: string) {
                    return !v || urlRegex.test(v);
                },
                message: "Invalid URL format",
            },
            trim: true,
        },
        profilePhotoUrl: {
            type: String,
            validate: {
                validator: function (v: string) {
                    return !v || urlRegex.test(v);
                },
                message: "Invalid URL format",
            },
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot be more than 5"],
        },
        text: {
            type: String,
            required: [true, "Review text is required"],
            trim: true,
        },
        relativeTimeDescription: {
            type: String,
            trim: true,
        },
        language: {
            type: String,
            match: [
                languageRegex,
                'Please enter a valid language code (e.g., "en" or "en-US")',
            ],
            trim: true,
        },
        time: {
            type: Date,
            default: Date.now,
        },
        likes: {
            type: Number,
            default: 0,
            min: [0, "Likes cannot be negative"],
        },
        isLocalGuide: {
            type: Boolean,
            default: false,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Static method to find by reviewId
ReviewSchema.statics.findByReviewId = function (reviewId: string) {
    return this.findOne({ reviewId });
};

// Static method to find by placeId
ReviewSchema.statics.findByPlaceId = function (placeId: string) {
    return this.find({ placeId });
};

// Create text index for searching
ReviewSchema.index({ text: "text", authorName: "text" });

// Check if the model already exists to prevent overwriting during hot reloads in development
const Review = mongoose.models.Review as IReviewModel ||
    mongoose.model<IReviewDocument, IReviewModel>("Review", ReviewSchema);

export default Review;
