import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthRequest } from "../auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

// Mock dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => ({
      body,
      options,
    })),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

describe("Auth Middleware", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock handler function
  const mockHandler = jest.fn().mockImplementation((req: AuthRequest) => {
    return Promise.resolve(
      NextResponse.json({ success: true, user: req.user }),
    );
  });

  // Helper to create a mock request
  const createMockRequest = (headers = {}) => {
    return {
      headers: new Headers(headers),
      cookies: { get: jest.fn() },
    } as unknown as NextRequest;
  };

  it("uses pre-existing user object if available (for testing)", async () => {
    // Create a request with a pre-existing user object
    const req = createMockRequest() as AuthRequest;
    req.user = {
      id: "test-user-id",
      email: "test@example.com",
      role: "admin",
    };

    await withAuth(req, mockHandler);

    // Handler should be called with the pre-existing user
    expect(mockHandler).toHaveBeenCalled();
    const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
    expect(authReq.user).toEqual({
      id: "test-user-id",
      email: "test@example.com",
      role: "admin",
    });

    // Session functions should not be called
    expect(getServerSession).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("authenticates using NextAuth session", async () => {
    // Mock getServerSession to return a valid session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: "session-user-id",
        email: "session@example.com",
        role: "customer",
      },
    });

    const req = createMockRequest();
    await withAuth(req, mockHandler);

    // Handler should be called with the session user
    expect(mockHandler).toHaveBeenCalled();
    const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
    expect(authReq.user).toEqual({
      id: "session-user-id",
      email: "session@example.com",
      role: "customer",
    });
  });

  it("falls back to JWT token if session is not available", async () => {
    // Mock getServerSession to return null
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Mock getToken to return a valid token
    (getToken as jest.Mock).mockResolvedValue({
      id: "token-user-id",
      email: "token@example.com",
      role: "user",
    });

    const req = createMockRequest();
    await withAuth(req, mockHandler);

    // Handler should be called with the token user
    expect(mockHandler).toHaveBeenCalled();
    const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
    expect(authReq.user).toEqual({
      id: "token-user-id",
      email: "token@example.com",
      role: "user",
    });
  });

  it("falls back to Authorization header if session and token are not available", async () => {
    // Mock getServerSession to return null
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Mock getToken to return null
    (getToken as jest.Mock).mockResolvedValue(null);

    // Create request with Authorization header
    const req = createMockRequest({
      Authorization: "Bearer user-id-from-header",
    });

    await withAuth(req, mockHandler);

    // Handler should be called with the user from the header
    expect(mockHandler).toHaveBeenCalled();
    const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
    expect(authReq.user).toEqual({
      id: "user-id-from-header",
      email: "",
    });
  });

  it("returns 401 if no authentication method succeeds", async () => {
    // Mock getServerSession to return null
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Mock getToken to return null
    (getToken as jest.Mock).mockResolvedValue(null);

    // Create request without Authorization header
    const req = createMockRequest();

    await withAuth(req, mockHandler);

    // Should return 401 Unauthorized
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unauthorized - Not authenticated" },
      { status: 401 },
    );

    // Handler should not be called
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("handles authentication errors gracefully", async () => {
    // Mock getServerSession to throw an error
    (getServerSession as jest.Mock).mockRejectedValue(new Error("Auth error"));

    const req = createMockRequest();
    await withAuth(req, mockHandler);

    // Should return 401 Unauthorized
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unauthorized - Authentication error" },
      { status: 401 },
    );

    // Handler should not be called
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
