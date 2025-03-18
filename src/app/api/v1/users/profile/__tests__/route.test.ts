import { NextRequest } from "next/server";
import { GET, PUT } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { withAuth } from "@/middleware/auth";

// Mock the auth middleware
jest.mock("@/middleware/auth", () => ({
  withAuth: jest.fn((req, handler) => handler(req)),
}));

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Profile API", () => {
  let userId: string;
  let token: string;

  beforeEach(async () => {
    // Create a test user
    const user = await User.create({
      email: "test@example.com",
      password: "password123",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId = (user as any)._id.toString();

    // Create a JWT token
    process.env.JWT_SECRET = "test-secret";
    token = jwt.sign(
      { id: userId, email: "test@example.com" },
      process.env.JWT_SECRET,
    );
  });

  describe("GET /api/v1/users/profile", () => {
    it("should return 404 if user not found", async () => {
      // Mock the auth middleware to return a non-existent user ID
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: {
            id: new mongoose.Types.ObjectId().toString(),
            email: "nonexistent@example.com",
          },
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/users/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const response = await GET(req);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("User not found");
    });

    it("should return user profile", async () => {
      // Mock the auth middleware to return our test user
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: userId, email: "test@example.com" },
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/users/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const response = await GET(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.email).toBe("test@example.com");
    });
  });

  describe("PUT /api/v1/users/profile", () => {
    it("should update user profile", async () => {
      // Mock the auth middleware and request body
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: userId, email: "test@example.com" },
          json: () => Promise.resolve({ email: "updated@example.com" }),
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/users/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: "updated@example.com" }),
        },
      );

      const response = await PUT(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.email).toBe("updated@example.com");

      // Verify the user was updated in the database
      const updatedUser = await User.findById(userId);
      expect(updatedUser!.email).toBe("updated@example.com");
    });

    it("should not update password through profile endpoint", async () => {
      // Get the original hashed password
      const originalUser = await User.findById(userId).select("+password");
      const originalPassword = originalUser!.password;

      // Mock the auth middleware and request body
      (withAuth as jest.Mock).mockImplementationOnce((req, handler) => {
        return handler({
          ...req,
          user: { id: userId, email: "test@example.com" },
          json: () => Promise.resolve({ password: "newpassword123" }),
        });
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v1/users/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: "newpassword123" }),
        },
      );

      await PUT(req);

      // Verify the password was not updated
      const updatedUser = await User.findById(userId).select("+password");
      expect(updatedUser!.password).toBe(originalPassword);
    });
  });
});
