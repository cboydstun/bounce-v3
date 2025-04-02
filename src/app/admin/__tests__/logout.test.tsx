import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import AdminLayout from "../layout";
import { AuthProvider } from "@/contexts/AuthContext";

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the next-auth/react module
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the setAuthToken function
jest.mock("@/utils/api", () => ({
  setAuthToken: jest.fn(),
}));

describe("AdminLayout Logout Functionality", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup session mock with authenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: "123",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });

    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value:
        "next-auth.session-token=test-token; next-auth.csrf-token=test-csrf",
    });
  });

  test("logout button should call signOut and redirect to login page", async () => {
    // Mock signOut to resolve successfully
    (signOut as jest.Mock).mockResolvedValue(undefined);

    // Render the component with AuthProvider
    render(
      <AuthProvider>
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      </AuthProvider>,
    );

    // Find and click the logout button
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    // Verify signOut was called with the correct parameters
    expect(signOut).toHaveBeenCalledWith({ redirect: false });

    // Wait for the async logout function to complete
    await waitFor(() => {
      // Verify router.push was called with '/login'
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  test("logout should clear cookies even if signOut fails", async () => {
    // Mock signOut to reject with an error
    (signOut as jest.Mock).mockRejectedValue(new Error("SignOut failed"));

    // Render the component with AuthProvider
    render(
      <AuthProvider>
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      </AuthProvider>,
    );

    // Find and click the logout button
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    // Wait for the async logout function to complete
    await waitFor(() => {
      // Verify router.push was still called with '/login' despite the error
      expect(mockRouter.push).toHaveBeenCalledWith("/login");

      // Verify cookies were cleared
      expect(document.cookie).not.toContain("next-auth.session-token");
    });
  });
});
