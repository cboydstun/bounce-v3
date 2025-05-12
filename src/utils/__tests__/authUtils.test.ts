import { checkOwnership, requireOwnership } from "../authUtils";
import { AuthRequest } from "@/middleware/auth";
import { NextResponse } from "next/server";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => ({
      body,
      options,
    })),
  },
}));

describe("Auth Utils", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkOwnership", () => {
    it("returns true when user is admin", () => {
      // Create a mock request with admin role
      const req = {
        user: {
          id: "user-123",
          email: "admin@example.com",
          role: "admin",
        },
      } as AuthRequest;

      // Check ownership with a different resource owner ID
      const result = checkOwnership(req, "resource-owner-456");

      // Admin should have access regardless of resource owner
      expect(result).toBe(true);
    });

    it("returns true when user is the resource owner", () => {
      // Create a mock request with customer role
      const req = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      } as AuthRequest;

      // Check ownership with matching user ID
      const result = checkOwnership(req, "user-123");

      // User should have access to their own resources
      expect(result).toBe(true);
    });

    it("returns false when user is not admin and not the resource owner", () => {
      // Create a mock request with customer role
      const req = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      } as AuthRequest;

      // Check ownership with different user ID
      const result = checkOwnership(req, "resource-owner-456");

      // User should not have access to others' resources
      expect(result).toBe(false);
    });

    it("handles undefined resource owner ID", () => {
      // Create a mock request with customer role
      const req = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      } as AuthRequest;

      // Check ownership with undefined resource owner ID
      const result = checkOwnership(req, undefined);

      // User should not have access to resources with undefined owner
      expect(result).toBe(false);
    });
  });

  describe("requireOwnership", () => {
    it("returns null when user is admin", () => {
      // Create a mock request with admin role
      const req = {
        user: {
          id: "user-123",
          email: "admin@example.com",
          role: "admin",
        },
      } as AuthRequest;

      // Require ownership with a different resource owner ID
      const result = requireOwnership(req, "resource-owner-456", "contact");

      // Admin should have access, so no error response
      expect(result).toBeNull();
    });

    it("returns null when user is the resource owner", () => {
      // Create a mock request with customer role
      const req = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      } as AuthRequest;

      // Require ownership with matching user ID
      const result = requireOwnership(req, "user-123", "contact");

      // User should have access to their own resources, so no error response
      expect(result).toBeNull();
    });

    it("returns 403 error when user is not admin and not the resource owner", () => {
      // Create a mock request with customer role
      const req = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      } as AuthRequest;

      // Require ownership with different user ID
      const result = requireOwnership(req, "resource-owner-456", "contact");

      // User should not have access to others' resources, so expect error response
      expect(result).not.toBeNull();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not authorized to modify this contact" },
        { status: 403 },
      );
    });

    it("uses default resource type in error message when not provided", () => {
      // Create a mock request with customer role
      const req = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "customer",
        },
      } as AuthRequest;

      // Require ownership with different user ID and no resource type
      const result = requireOwnership(req, "resource-owner-456");

      // User should not have access, so expect error response with default resource type
      expect(result).not.toBeNull();
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not authorized to modify this resource" },
        { status: 403 },
      );
    });
  });
});
