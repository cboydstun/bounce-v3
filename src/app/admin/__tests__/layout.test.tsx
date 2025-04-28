import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminLayout from "../layout";
import { AuthProvider } from "@/contexts/AuthContext";

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

// Mock the Sidebar component
jest.mock("@/components/ui/Sidebar", () => {
  return function MockSidebar({ isCollapsed, setIsCollapsed }: any) {
    return (
      <div data-testid="sidebar">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          data-testid="toggle-sidebar"
        >
          Toggle Sidebar
        </button>
        <div>Sidebar {isCollapsed ? "Collapsed" : "Expanded"}</div>
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
        user: { id: "123", email: "test@example.com" },
      },
      status: "authenticated",
    });
  });

  test("renders sidebar and main content", () => {
    render(
      <AuthProvider>
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      </AuthProvider>,
    );

    // Check that sidebar is rendered
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();

    // Check that main content is rendered
    expect(screen.getByText("Test Content")).toBeInTheDocument();

    // Check that logout button is rendered
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("toggles sidebar collapse state", () => {
    render(
      <AuthProvider>
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      </AuthProvider>,
    );

    // Initially sidebar should be expanded
    expect(screen.getByText("Sidebar Expanded")).toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(screen.getByTestId("toggle-sidebar"));

    // Sidebar should now be collapsed
    expect(screen.getByText("Sidebar Collapsed")).toBeInTheDocument();
  });

  test("shows loading state initially", () => {
    // Mock the loading state
    jest
      .spyOn(React, "useState")
      .mockImplementationOnce(() => [true, jest.fn()]);

    render(
      <AuthProvider>
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      </AuthProvider>,
    );

    // Should render a loading div
    const loadingDiv = screen.getByTestId("loading");
    expect(loadingDiv).toBeInTheDocument();

    // Content should not be rendered
    expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
  });
});
