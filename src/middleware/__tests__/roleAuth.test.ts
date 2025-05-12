import { NextRequest, NextResponse } from "next/server";
import { withRoleAuth, withAdminAuth, withUserAuth } from "../roleAuth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { AuthRequest } from "../auth";

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

describe("Role Auth Middleware", () => {
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
  const createMockRequest = () => {
    // Create a mock object with the minimum properties needed
    const req = {
      headers: new Headers(),
      cookies: { get: jest.fn() },
      clone: jest.fn(),
    };

    // Set up the clone method to return the same object
    req.clone.mockReturnValue(req);

    // Cast to NextRequest
    return req as unknown as NextRequest;
  };

  describe("withRoleAuth", () => {
    it("returns 401 if user is not authenticated", async () => {
      // Mock getServerSession to return null (not authenticated)
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest();
      const result = await withRoleAuth(req, mockHandler, "admin");

      // Should return 401 Unauthorized
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );

      // Handler should not be called
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("returns 403 if user does not have required role", async () => {
      // Mock getServerSession to return customer role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      });

      const req = createMockRequest();
      const result = await withRoleAuth(req, mockHandler, "admin");

      // Should return 403 Forbidden
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized - Requires admin role" },
        { status: 403 },
      );

      // Handler should not be called
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("allows access if user has exact required role", async () => {
      // Mock getServerSession to return customer role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      });

      const req = createMockRequest();
      await withRoleAuth(req, mockHandler, "customer");

      // Handler should be called with user data
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "user-123",
        email: "user@example.com",
        role: "customer",
      });
    });

    it("allows admin access to customer routes", async () => {
      // Mock getServerSession to return admin role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: "admin",
        },
      });

      const req = createMockRequest();
      await withRoleAuth(req, mockHandler, "customer");

      // Handler should be called with user data
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
      });
    });

    it("handles authentication errors gracefully", async () => {
      // Mock getServerSession to throw an error
      (getServerSession as jest.Mock).mockRejectedValue(
        new Error("Auth error"),
      );

      const req = createMockRequest();
      await withRoleAuth(req, mockHandler, "admin");

      // Should return 401 Unauthorized with the correct error message
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized - Authentication error" },
        { status: 401 },
      );

      // Handler should not be called
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("tries to use JWT token if session is not available", async () => {
      // Mock getServerSession to return null
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // Mock getToken to return a valid token
      (getToken as jest.Mock).mockResolvedValue({
        id: "token-user-123",
        email: "token-user@example.com",
        role: "customer",
      });

      const req = createMockRequest();
      await withRoleAuth(req, mockHandler, "customer");

      // Handler should be called with user data from token
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "token-user-123",
        email: "token-user@example.com",
        role: "customer",
      });
    });

    it("checks Authorization header if session and token are not available", async () => {
      // Mock getServerSession and getToken to return null
      (getServerSession as jest.Mock).mockResolvedValue(null);
      (getToken as jest.Mock).mockResolvedValue(null);

      // Create request with Authorization header
      const req = createMockRequest();
      const headers = new Headers();
      headers.set("Authorization", "Bearer test-token-123");
      headers.set("X-User-Role", "customer");
      Object.defineProperty(req, "headers", {
        value: headers,
        writable: true,
      });

      await withRoleAuth(req, mockHandler, "customer");

      // Handler should be called with user data from header
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "test-token-123",
        email: "",
        role: "customer",
      });
    });
  });

  describe("withAdminAuth", () => {
    it("calls withRoleAuth with admin role", async () => {
      // Mock getServerSession to return admin role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: "admin",
        },
      });

      const req = createMockRequest();
      await withAdminAuth(req, mockHandler);

      // Handler should be called with user data
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
      });
    });
  });

  describe("withUserAuth", () => {
    it("calls withRoleAuth with customer role", async () => {
      // Mock getServerSession to return customer role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      });

      const req = createMockRequest();
      await withUserAuth(req, mockHandler);

      // Handler should be called with user data
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "user-123",
        email: "user@example.com",
        role: "customer",
      });
    });

    it("allows admin access to user routes", async () => {
      // Mock getServerSession to return admin role
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: "admin",
        },
      });

      const req = createMockRequest();
      await withUserAuth(req, mockHandler);

      // Handler should be called with user data
      expect(mockHandler).toHaveBeenCalled();
      const authReq = mockHandler.mock.calls[0][0] as AuthRequest;
      expect(authReq.user).toEqual({
        id: "admin-123",
        email: "admin@example.com",
        role: "admin",
      });
    });
  });
});
