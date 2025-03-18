import { NextRequest } from "next/server";
import { POST } from "../route";
import * as dbHandler from "@/lib/test/db-handler";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// Mock the rate limiter
jest.mock("express-rate-limit", () => {
  return () => {
    return () => ({ status: 200 });
  };
});

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Login API", () => {
  beforeEach(async () => {
    // Create a test user
    await User.create({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should return 400 if email or password is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Email and password are required");
  });

  it("should return 401 for invalid credentials", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Invalid credentials");
  });

  it("should return JWT token for valid credentials", async () => {
    // Mock JWT_SECRET environment variable
    process.env.JWT_SECRET = "test-secret";

    const req = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.token).toBeDefined();

    // Verify the token
    const decoded = jwt.verify(data.token, process.env.JWT_SECRET) as {
      id: string;
      email: string;
    };
    expect(decoded.email).toBe("test@example.com");
  });
});
