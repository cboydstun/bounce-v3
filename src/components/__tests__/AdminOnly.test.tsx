import React from "react";
import { render, screen } from "@testing-library/react";
import { AdminOnly } from "../ui/AdminOnly";
import { useAuth } from "@/contexts/AuthContext";

// Mock the AuthContext
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("AdminOnly Component", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when user is admin", () => {
    // Mock the useAuth hook to return isAdmin: true
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
    });

    render(
      <AdminOnly>
        <div data-testid="admin-content">Admin Content</div>
      </AdminOnly>,
    );

    // Check that the admin content is rendered
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });

  it("does not render children when user is not admin", () => {
    // Mock the useAuth hook to return isAdmin: false
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
    });

    render(
      <AdminOnly>
        <div data-testid="admin-content">Admin Content</div>
      </AdminOnly>,
    );

    // Check that the admin content is not rendered
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("renders fallback content when user is not admin and fallback is provided", () => {
    // Mock the useAuth hook to return isAdmin: false
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
    });

    render(
      <AdminOnly
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="admin-content">Admin Content</div>
      </AdminOnly>,
    );

    // Check that the fallback content is rendered
    expect(screen.getByTestId("fallback-content")).toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();

    // Check that the admin content is not rendered
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("handles loading state correctly", () => {
    // Mock the useAuth hook to return loading: true
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
      loading: true,
    });

    render(
      <AdminOnly>
        <div data-testid="admin-content">Admin Content</div>
      </AdminOnly>,
    );

    // When loading, it should behave as if the user is not an admin
    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });
});
