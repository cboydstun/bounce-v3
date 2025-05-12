import { NextRequest, NextResponse } from "next/server";
import { withRoleAuth, withAdminAuth, withUserAuth } from "../roleAuth";
import { getServerSession } from "next-auth";
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
    return {
      headers: new Headers(),
      cookies: { get: jest.fn() },
    } as unknown as NextRequest;
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

      // Should return 401 Unauthorized
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized - Authentication error" },
        { status: 401 },
      );

      // Handler should not be called
      expect(mockHandler).not.toHaveBeenCalled();
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
