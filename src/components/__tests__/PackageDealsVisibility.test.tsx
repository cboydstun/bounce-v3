/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import Navigation from "../Navigation";
import Footer from "../Footer";
import {
  PackageDealsProvider,
  usePackageDeals,
} from "../../contexts/PackageDealsContext";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock the PackageDealsContext
jest.mock("../../contexts/PackageDealsContext", () => {
  const originalModule = jest.requireActual(
    "../../contexts/PackageDealsContext",
  );

  return {
    ...originalModule,
    usePackageDeals: jest.fn(),
  };
});

describe("Package Deals Visibility", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue("/");
  });

  describe("Navigation Component", () => {
    it("should always show Package Deals link regardless of form completion status", () => {
      // Mock the context to return false for hasCompletedForm
      (usePackageDeals as jest.Mock).mockReturnValue({
        hasCompletedForm: false,
        setFormCompleted: jest.fn(),
      });

      render(<Navigation />);

      // Verify Package Deals link is present
      expect(screen.getByText("Package Deals")).toBeInTheDocument();
    });
  });

  describe("Footer Component", () => {
    it("should always show Package Deals link regardless of form completion status", () => {
      // Mock the context to return false for hasCompletedForm
      (usePackageDeals as jest.Mock).mockReturnValue({
        hasCompletedForm: false,
        setFormCompleted: jest.fn(),
      });

      render(<Footer />);

      // Verify Package Deals link is present
      expect(screen.getByText("Package Deals")).toBeInTheDocument();
    });
  });
});
