import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Review from "@/models/Review";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Single Review API", () => {
  let reviewId: string;
  let authToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      email: "test@example.com",
      password: "password123",
    });
    // Assert the type of _id
    const userObjectId = user._id as mongoose.Types.ObjectId;

    // Create admin user
    const admin = await User.create({
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    });
    // Assert the type of _id
    const adminObjectId = admin._id as mongoose.Types.ObjectId;

    // Generate auth tokens
    authToken = jwt.sign(
      { id: userObjectId.toString(), email: user.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    adminToken = jwt.sign(
      { id: adminObjectId.toString(), email: admin.email, role: "admin" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1d" },
    );

    // Create test review
    const review = await Review.create({
      placeId: "place1",
      reviewId: "review1",
      authorName: "John Doe",
      rating: 5,
      text: "Great place!",
      time: new Date(),
      likes: 10,
      isLocalGuide: false,
      user: userObjectId,
    });

    reviewId = (review._id as mongoose.Types.ObjectId).toString();
  });

  describe("GET /api/v1/reviews/[id]", () => {
    it("should return 404 if review not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${nonExistentId}`,
      );

      const response = await GET(req, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Review not found");
    });

    it("should return review if found", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${reviewId}`,
      );

      const response = await GET(req, {
        params: Promise.resolve({ id: reviewId }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data._id.toString()).toBe(reviewId);
      expect(data.placeId).toBe("place1");
      expect(data.reviewId).toBe("review1");
      expect(data.authorName).toBe("John Doe");
    });
  });

  describe("PUT /api/v1/reviews/[id]", () => {
    it("should return 404 if review not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${nonExistentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            rating: 4,
            text: "Updated review",
          }),
        },
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Review not found");
    });

    it("should update review if user is owner", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${reviewId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            rating: 4,
            text: "Updated review",
          }),
        },
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: reviewId }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.rating).toBe(4);
      expect(data.text).toBe("Updated review");

      // Verify review was updated in database
      const review = await Review.findById(reviewId);
      expect(review?.rating).toBe(4);
      expect(review?.text).toBe("Updated review");
    });

    it("should update review if user is admin", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${reviewId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            rating: 3,
            text: "Admin updated review",
          }),
        },
      );

      const response = await PUT(req, {
        params: Promise.resolve({ id: reviewId }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.rating).toBe(3);
      expect(data.text).toBe("Admin updated review");
    });
  });

  describe("DELETE /api/v1/reviews/[id]", () => {
    let userObjectId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Get the user object ID from the existing user
      const user = await User.findOne({ email: "test@example.com" });
      userObjectId = user?._id as mongoose.Types.ObjectId;
    });
    it("should return 404 if review not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${nonExistentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Review not found");
    });

    it("should delete review if user is owner", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: reviewId }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe("Review deleted successfully");

      // Verify review was deleted from database
      const review = await Review.findById(reviewId);
      expect(review).toBeNull();
    });

    it("should delete review if user is admin", async () => {
      // Create another review
      const review2 = await Review.create({
        placeId: "place2",
        reviewId: "review2",
        authorName: "Jane Smith",
        rating: 4,
        text: "Nice place!",
        time: new Date(),
        likes: 5,
        isLocalGuide: true,
        user: userObjectId,
      });

      const reviewId2 = (review2._id as mongoose.Types.ObjectId).toString();

      const req = new NextRequest(
        `http://localhost:3000/api/v1/reviews/${reviewId2}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ id: reviewId2 }),
      });
      expect(response.status).toBe(200);

      // Verify review was deleted from database
      const deletedReview = await Review.findById(reviewId2);
      expect(deletedReview).toBeNull();
    });
  });
});
