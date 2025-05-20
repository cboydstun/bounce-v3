import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import Review from "@/models/Review";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Reviews API", () => {
  describe("GET /api/v1/reviews", () => {
    beforeEach(async () => {
      // Create test reviews
      await Review.create([
        {
          placeId: "place1",
          reviewId: "review1",
          authorName: "John Doe",
          rating: 5,
          text: "Great place!",
          time: new Date(),
          likes: 10,
          isLocalGuide: false,
        },
        {
          placeId: "place1",
          reviewId: "review2",
          authorName: "Jane Smith",
          rating: 4,
          text: "Nice place!",
          time: new Date(),
          likes: 5,
          isLocalGuide: true,
        },
        {
          placeId: "place2",
          reviewId: "review3",
          authorName: "Bob Johnson",
          rating: 3,
          text: "Average place.",
          time: new Date(),
          likes: 2,
          isLocalGuide: false,
        },
      ]);
    });

    it("should return all reviews with pagination", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/reviews");

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.reviews).toHaveLength(3);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(3);
    });

    it("should filter reviews by placeId", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/reviews?placeId=place1",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.reviews).toHaveLength(2);
      expect(data.reviews[0].placeId).toBe("place1");
      expect(data.reviews[1].placeId).toBe("place1");
    });

    it("should return all reviews without pagination", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/reviews?limit=2&page=1",
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      // Should return all 3 reviews despite the limit parameter
      expect(data.reviews).toHaveLength(3);
      // Pagination object should still be present for backward compatibility
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(3);
      expect(data.pagination.pages).toBe(1);
      expect(data.pagination.total).toBe(3);
    });
  });

  describe("POST /api/v1/reviews", () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        email: "test@example.com",
        password: "password123",
      });
      const userObjectId = user._id as mongoose.Types.ObjectId;
      userId = userObjectId.toString();

      // Generate auth token
      authToken = jwt.sign(
        { id: userId, email: user.email },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1d" },
      );

      // Set global mockAuthState to authenticated
      global.mockAuthState = {
        authenticated: true,
        isAdmin: false,
      };
    });

    it("should return 400 if required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          placeId: "place1",
          // Missing authorName, rating, text
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Missing required fields");
    });

    it("should create a new review successfully", async () => {
      // Mock getServerSession to return a session with our test user ID
      (getServerSession as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve({
          user: {
            id: userId, // Use the actual user ID from our test
            email: "test@example.com",
            name: "Test User",
            role: "user",
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      });
      
      const req = new NextRequest("http://localhost:3000/api/v1/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          placeId: "place1",
          authorName: "Test User",
          rating: 5,
          text: "Excellent place!",
          isLocalGuide: false,
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.placeId).toBe("place1");
      expect(data.authorName).toBe("Test User");
      expect(data.rating).toBe(5);
      expect(data.text).toBe("Excellent place!");
      expect(data.reviewId).toBeDefined();
      expect(data.user).toBeDefined();

      // Verify review was saved to database
      const review = await Review.findOne({ reviewId: data.reviewId });
      expect(review).not.toBeNull();
    });
  });
});
