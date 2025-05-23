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
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on console methods to verify they're called and suppress output
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods after each test
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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

    // Console methods should not be called for successful auth
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
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

    // Console methods should not be called for successful auth
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
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

    // Console methods should not be called for successful auth
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
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

    // Console methods should not be called for successful auth
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns 401 if no authentication method succeeds and logs warning", async () => {
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

    // Should log warning about no valid authentication
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Auth middleware: No valid authentication found",
      { url: undefined, method: undefined },
    );

    // Should not log error
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("handles authentication errors gracefully and logs error", async () => {
    // Mock getServerSession to throw an error
    const authError = new Error("Auth error");
    (getServerSession as jest.Mock).mockRejectedValue(authError);

    const req = createMockRequest();
    await withAuth(req, mockHandler);

    // Should return 401 Unauthorized
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unauthorized - Authentication error" },
      { status: 401 },
    );

    // Handler should not be called
    expect(mockHandler).not.toHaveBeenCalled();

    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Auth middleware error:",
      authError,
    );

    // Should not log warning
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
