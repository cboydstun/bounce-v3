import { NextRequest, NextResponse } from "next/server";
import { POST } from "../route";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// Get access to the ipThrottling map from the route file
// This is a hack to reset the rate limiting between tests
import * as routeModule from "../route";
const ipThrottlingMap = (routeModule as any).ipThrottling;

// Mock the dependencies
jest.mock("@/lib/db/mongoose");
jest.mock("jsonwebtoken");

// Mock mongoose
jest.mock("mongoose", () => {
  return {
    connection: {
      readyState: 1, // 1 = connected
    },
    // Add Schema constructor
    Schema: jest.fn().mockImplementation(() => ({
      pre: jest.fn().mockReturnThis(),
      methods: {},
      statics: {},
    })),
  };
});

// Mock User model with chainable methods
jest.mock("@/models/User", () => {
  const mockUser = {
    _id: "user123",
    email: "test@example.com",
    comparePassword: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      findOne: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockUser)
      })),
      findById: jest.fn().mockResolvedValue(mockUser),
    },
  };
});

// Create a custom type for our mocked response
type MockedResponse = {
  json: () => any;
  status: number;
  cookies: {
    set: jest.Mock;
  };
};

// Mock the NextResponse
jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn().mockImplementation((data, options) => {
        const response = {
          json: () => data,
          status: options?.status || 200,
          cookies: {
            set: jest.fn(),
          },
        };
        return response;
      }),
    },
  };
});

describe("Login API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limiting between tests
    if (ipThrottlingMap) {
      ipThrottlingMap.clear();
    }

    // No need to mock mongoose connection readyState here anymore
    // as it's mocked at the module level
  });

  it("should return 400 if email or password is missing", async () => {
    // Create a request with missing credentials
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({ error: "Email and password are required" });
    expect(response.status).toEqual(400);
  });

  it("should return 401 if user is not found", async () => {
    // Mock User.findOne to return null (user not found)
    const mockSelectFn = jest.fn().mockResolvedValue(null);
    (User.findOne as jest.Mock).mockReturnValue({
      select: mockSelectFn
    });

    // Create a request with valid format but non-existent user
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({ error: "Invalid credentials" });
    expect(response.status).toEqual(401);
    expect(User.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
    expect(mockSelectFn).toHaveBeenCalledWith("+password");
  });

  it("should return 401 if password is incorrect", async () => {
    // Mock user with comparePassword that returns false
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    // Mock User.findOne to return the mock user
    const mockSelectFn = jest.fn().mockResolvedValue(mockUser);
    (User.findOne as jest.Mock).mockReturnValue({
      select: mockSelectFn
    });

    // Create a request with valid user but wrong password
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({ error: "Invalid credentials" });
    expect(response.status).toEqual(401);
    expect(mockUser.comparePassword).toHaveBeenCalledWith("wrongpassword");
    expect(mockSelectFn).toHaveBeenCalledWith("+password");
  });

  it("should return 500 if JWT_SECRET is not defined", async () => {
    // Save original env
    const originalEnv = process.env;

    // Mock process.env to remove JWT_SECRET
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;

    // Mock user with comparePassword that returns true
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    // Mock User.findOne to return the mock user
    const mockSelectFn = jest.fn().mockResolvedValue(mockUser);
    (User.findOne as jest.Mock).mockReturnValue({
      select: mockSelectFn
    });

    // Create a request with valid credentials
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({ error: "Server configuration error" });
    expect(response.status).toEqual(500);
    expect(mockSelectFn).toHaveBeenCalledWith("+password");

    // Restore original env
    process.env = originalEnv;
  });

  it("should return token and set cookie for valid credentials without rememberMe", async () => {
    // Mock JWT_SECRET
    process.env.JWT_SECRET = "test-secret";

    // Mock user with comparePassword that returns true
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    // Mock User.findOne to return the mock user
    const mockSelectFn = jest.fn().mockResolvedValue(mockUser);
    (User.findOne as jest.Mock).mockReturnValue({
      select: mockSelectFn
    });

    // Mock jwt.sign to return a token
    (jwt.sign as jest.Mock).mockReturnValue("fake-token");

    // Create a request with valid credentials
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({ token: "fake-token" });
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "user123", email: "test@example.com" },
      "test-secret",
      { expiresIn: "1d" }
    );
    expect(response.cookies.set).toHaveBeenCalledWith({
      name: "auth_token",
      value: "fake-token",
      httpOnly: false,
      secure: false,
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: "/",
      sameSite: "lax",
    });
    expect(mockSelectFn).toHaveBeenCalledWith("+password");
  });

  it("should return token and set cookie with longer expiration for valid credentials with rememberMe", async () => {
    // Mock JWT_SECRET
    process.env.JWT_SECRET = "test-secret";

    // Mock user with comparePassword that returns true
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    // Mock User.findOne to return the mock user
    const mockSelectFn = jest.fn().mockResolvedValue(mockUser);
    (User.findOne as jest.Mock).mockReturnValue({
      select: mockSelectFn
    });

    // Mock jwt.sign to return a token
    (jwt.sign as jest.Mock).mockReturnValue("fake-token");

    // Create a request with valid credentials and rememberMe
    // Use a different IP address to avoid rate limiting
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.100", // Different IP
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      }),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({ token: "fake-token" });
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "user123", email: "test@example.com" },
      "test-secret",
      { expiresIn: "30d" }
    );
    expect(response.cookies.set).toHaveBeenCalledWith({
      name: "auth_token",
      value: "fake-token",
      httpOnly: false,
      secure: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
      path: "/",
      sameSite: "lax",
    });
    expect(mockSelectFn).toHaveBeenCalledWith("+password");
  });

  it("should handle database connection errors", async () => {
    // Mock dbConnect to throw an error with specific message
    (dbConnect as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));

    // Create a request with valid credentials
    // Use a different IP address to avoid rate limiting
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.200", // Different IP
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);

    expect(response.json()).toEqual({
      error: "Database connection failed. Please try again later."
    });
    expect(response.status).toEqual(500);
  });

  it("should handle rate limiting", async () => {
    // Reset rate limiting for this test
    if (ipThrottlingMap) {
      ipThrottlingMap.clear();
    }

    // Create a request with an IP that has exceeded the rate limit
    const request = new NextRequest("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.1",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Call the endpoint 6 times (exceeding the limit of 5)
    await POST(request);
    await POST(request);
    await POST(request);
    await POST(request);
    await POST(request);
    const response = await POST(request);

    expect(response.json()).toEqual({
      error: "Too many login attempts, please try again later"
    });
    expect(response.status).toEqual(429);
  });
});
