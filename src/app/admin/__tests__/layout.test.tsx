import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminLayout from "../layout";

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/admin"),
}));

// Mock the next-auth/react module
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the AuthContext
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn().mockReturnValue({
    loading: false,
    isAdmin: true,
    user: { role: "admin" },
    logout: jest.fn(),
    error: null,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the Sidebar component
jest.mock("@/components/ui/Sidebar", () => {
  return function MockSidebar({
    isCollapsed,
    setIsCollapsed,
    userRole,
    onLogout,
  }: any) {
    return (
      <div data-testid="sidebar">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          data-testid="toggle-sidebar"
        >
          Toggle Sidebar
        </button>
        <div>Sidebar {isCollapsed ? "Collapsed" : "Expanded"}</div>
        {userRole && <div data-testid="user-role">Role: {userRole}</div>}
        {onLogout && (
          <button onClick={onLogout} data-testid="logout-button">
            Logout
          </button>
        )}
      </div>
    );
  };
});

describe("AdminLayout", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: "123", email: "test@example.com", role: "admin" },
      },
      status: "authenticated",
    });
  });

  test("renders sidebar and main content", () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    // Check that sidebar is rendered
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();

    // Check that main content is rendered
    expect(screen.getByText("Test Content")).toBeInTheDocument();

    // Check that logout button is rendered
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  test("toggles sidebar collapse state", () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    // Initially sidebar should be expanded
    expect(screen.getByText("Sidebar Expanded")).toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(screen.getByTestId("toggle-sidebar"));

    // Sidebar should now be collapsed
    expect(screen.getByText("Sidebar Collapsed")).toBeInTheDocument();
  });

  test("shows loading state when auth is loading", () => {
    // Temporarily override the mock for this test
    const useAuthMock = require("@/contexts/AuthContext").useAuth;
    useAuthMock.mockReturnValueOnce({
      loading: true,
      isAdmin: true,
      user: { role: "admin" },
      logout: jest.fn(),
      error: null,
    });

    // Mock useState to keep isLoading as true
    const originalUseState = React.useState;
    jest
      .spyOn(React, "useState")
      .mockImplementationOnce(() => [true, jest.fn()]);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    // Restore original useState
    React.useState = originalUseState;

    // Should render a loading message
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Content should not be rendered
    expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
  });

  test("redirects non-admin users to login page", () => {
    // Temporarily override the mock for this test
    const useAuthMock = require("@/contexts/AuthContext").useAuth;
    useAuthMock.mockReturnValueOnce({
      loading: false,
      isAdmin: false,
      user: { role: "customer" },
      logout: jest.fn(),
      error: null,
    });

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    // Should redirect to login page
    expect(mockRouter.push).toHaveBeenCalledWith(
      "/login?message=Admin access required",
    );
  });

  test("displays user role in sidebar", () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    // Check that user role is displayed
    expect(screen.getByTestId("user-role")).toHaveTextContent("Role: admin");
  });
});
