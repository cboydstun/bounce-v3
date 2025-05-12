import { middleware } from "./middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isPackageDealsVisible } from "./utils/cookieUtils";

// Mock dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn().mockImplementation((url) => ({ url })),
    next: jest.fn().mockReturnValue({ type: "next" }),
  },
}));

jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

jest.mock("./utils/cookieUtils", () => ({
  isPackageDealsVisible: jest.fn(),
}));

describe("Middleware", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock request
  const createMockRequest = (path: string) => {
    const url = `https://example.com${path}`;
    return {
      nextUrl: {
        pathname: path,
        searchParams: {
          set: jest.fn(),
        },
      },
      url,
      cookies: {
        get: jest.fn(),
        getAll: jest.fn(),
      },
    } as any;
  };

  describe("Party Packages Access Control", () => {
    it("redirects to coupon form if package deals are not visible", async () => {
      // Mock isPackageDealsVisible to return false
      (isPackageDealsVisible as jest.Mock).mockReturnValue(false);

      const req = createMockRequest("/party-packages");
      await middleware(req);

      // Should check if package deals are visible
      expect(isPackageDealsVisible).toHaveBeenCalledWith(req.cookies);

      // Should redirect to coupon form
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/coupon-form",
        }),
      );
    });

    it("allows access to party packages if deals are visible", async () => {
      // Mock isPackageDealsVisible to return true
      (isPackageDealsVisible as jest.Mock).mockReturnValue(true);
      // Mock getToken to return a valid token
      (getToken as jest.Mock).mockResolvedValue({
        id: "user-123",
        role: "customer",
      });

      const req = createMockRequest("/party-packages");
      await middleware(req);

      // Should check if package deals are visible
      expect(isPackageDealsVisible).toHaveBeenCalledWith(req.cookies);

      // Should not redirect
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Should proceed to next middleware
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Admin Access Control", () => {
    it("redirects to login if user is not authenticated", async () => {
      // Mock getToken to return null (not authenticated)
      (getToken as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest("/admin/dashboard");
      await middleware(req);

      // Should redirect to login
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/login",
        }),
      );
    });

    it("redirects to login if user is authenticated but not admin", async () => {
      // Mock getToken to return a customer role
      (getToken as jest.Mock).mockResolvedValue({
        id: "user-123",
        role: "customer",
      });

      const req = createMockRequest("/admin/dashboard");

      // Create a mock URL constructor
      const mockSearchParams = { set: jest.fn() };
      const mockUrl = { searchParams: mockSearchParams };
      const originalURL = global.URL;
      global.URL = jest.fn(() => mockUrl as any) as any;

      await middleware(req);

      // Restore original URL constructor
      global.URL = originalURL;

      // Should redirect to login
      expect(NextResponse.redirect).toHaveBeenCalled();

      // Should set the message parameter
      expect(mockSearchParams.set).toHaveBeenCalledWith(
        "message",
        "Admin access required",
      );
    });

    it("allows access to admin routes for admin users", async () => {
      // Mock getToken to return an admin role
      (getToken as jest.Mock).mockResolvedValue({
        id: "admin-123",
        role: "admin",
      });

      const req = createMockRequest("/admin/dashboard");
      await middleware(req);

      // Should not redirect
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Should proceed to next middleware
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  it("handles errors gracefully", async () => {
    // Mock getToken to throw an error
    (getToken as jest.Mock).mockRejectedValue(new Error("Test error"));

    const req = createMockRequest("/admin/dashboard");
    await middleware(req);

    // Should proceed to next middleware even on error
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
