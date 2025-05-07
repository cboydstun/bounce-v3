import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe("Sidebar Component", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue("/admin");
  });

  test("renders all navigation items", () => {
    render(<Sidebar isCollapsed={false} setIsCollapsed={jest.fn()} />);

    // Check that all navigation items are rendered
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Blogs")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Routes")).toBeInTheDocument();
    expect(screen.getByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Visitors")).toBeInTheDocument();
    expect(screen.getByText("Promo Optins")).toBeInTheDocument();
  });

  test("highlights the active navigation item", () => {
    (usePathname as jest.Mock).mockReturnValue("/admin/blogs");
    render(<Sidebar isCollapsed={false} setIsCollapsed={jest.fn()} />);

    // The Blogs link should have the active class
    const blogsLink = screen.getByText("Blogs").closest("a");
    expect(blogsLink).toHaveClass("bg-primary-purple");
  });

  test("collapses and expands the sidebar", () => {
    const setIsCollapsed = jest.fn();
    render(<Sidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />);

    // Find and click the collapse button
    const collapseButton = screen.getByLabelText("Toggle sidebar");
    fireEvent.click(collapseButton);

    // Check that setIsCollapsed was called with true
    expect(setIsCollapsed).toHaveBeenCalledWith(true);
  });

  test("shows only icons when collapsed", () => {
    render(<Sidebar isCollapsed={true} setIsCollapsed={jest.fn()} />);

    // Text should not be visible when collapsed
    expect(screen.queryByText("Overview")).not.toBeVisible();
    expect(screen.queryByText("Blogs")).not.toBeVisible();

    // Icons should still be visible
    expect(screen.getByLabelText("Overview")).toBeInTheDocument();
    expect(screen.getByLabelText("Blogs")).toBeInTheDocument();
  });
});
