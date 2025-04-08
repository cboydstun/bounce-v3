import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "../auth";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Mock next-auth/jwt
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

// Mock console.log for debugging
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe("Auth Middleware", () => {
  // Setup test variables
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockEmail = "test@example.com";
  const mockSecret = "test-secret";

  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup environment variables
    process.env = { ...originalEnv };
    process.env.NEXTAUTH_SECRET = mockSecret;
    process.env.JWT_SECRET = mockSecret;
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  // Create a mock handler function
  const mockHandler = jest.fn().mockImplementation(async (req: AuthRequest) => {
    return NextResponse.json({ user: req.user });
  });

  // Test with NextAuth.js session token
  it("should authenticate with NextAuth.js session token", async () => {
    // Mock getToken to return a valid token
    (getToken as jest.Mock).mockResolvedValueOnce({
      id: mockUserId,
      email: mockEmail,
    });

    // Create a mock request
    const req = new NextRequest("http://localhost:3000/api/test");

    // Call withAuth middleware
    const response = await withAuth(req, mockHandler);

    // Verify getToken was called
    expect(getToken).toHaveBeenCalledWith({
      req,
      secret: mockSecret,
    });

    // Verify handler was called with user
    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].user).toEqual({
      id: mockUserId,
      email: mockEmail,
    });

    // Verify response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toEqual({
      id: mockUserId,
      email: mockEmail,
    });
  });

  // Test with Authorization header (Bearer token)
  it("should authenticate with Bearer token in Authorization header", async () => {
    // Mock getToken to return null (no NextAuth.js session)
    (getToken as jest.Mock).mockResolvedValueOnce(null);

    // Create a JWT token
    const token = jwt.sign({ id: mockUserId, email: mockEmail }, mockSecret, {
      expiresIn: "1d",
    });

    // Create a mock request with Authorization header
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Auth-Type": "nextauth",
      },
    });

    // Call withAuth middleware
    const response = await withAuth(req, mockHandler);

    // Verify getToken was called
    expect(getToken).toHaveBeenCalledWith({
      req,
      secret: mockSecret,
    });

    // Verify handler was called with user
    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler.mock.calls[0][0].user).toEqual({
      id: mockUserId,
      email: mockEmail,
    });

    // Verify response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toEqual({
      id: mockUserId,
      email: mockEmail,
    });
  });

  // Test with invalid Bearer token
  it("should reject invalid Bearer token", async () => {
    // Mock getToken to return null (no NextAuth.js session)
    (getToken as jest.Mock).mockResolvedValueOnce(null);

    // Create an invalid token
    const token = "invalid-token";

    // Create a mock request with Authorization header
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Auth-Type": "nextauth",
      },
    });

    // Call withAuth middleware
    const response = await withAuth(req, mockHandler);

    // Verify getToken was called
    expect(getToken).toHaveBeenCalledWith({
      req,
      secret: mockSecret,
    });

    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized - Invalid token");
  });

  // Test with no authentication
  it("should reject request with no authentication", async () => {
    // Mock getToken to return null (no NextAuth.js session)
    (getToken as jest.Mock).mockResolvedValueOnce(null);

    // Create a mock request with no Authorization header
    const req = new NextRequest("http://localhost:3000/api/test");

    // Call withAuth middleware
    const response = await withAuth(req, mockHandler);

    // Verify getToken was called
    expect(getToken).toHaveBeenCalledWith({
      req,
      secret: mockSecret,
    });

    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized - No token provided");
  });

  // Test with expired token
  it("should reject expired token", async () => {
    // Mock getToken to return null (no NextAuth.js session)
    (getToken as jest.Mock).mockResolvedValueOnce(null);

    // Create an expired JWT token
    const token = jwt.sign(
      { id: mockUserId, email: mockEmail },
      mockSecret,
      { expiresIn: "-1h" }, // Expired 1 hour ago
    );

    // Create a mock request with Authorization header
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Auth-Type": "nextauth",
      },
    });

    // Call withAuth middleware
    const response = await withAuth(req, mockHandler);

    // Verify getToken was called
    expect(getToken).toHaveBeenCalledWith({
      req,
      secret: mockSecret,
    });

    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized - Invalid token");
  });
});
