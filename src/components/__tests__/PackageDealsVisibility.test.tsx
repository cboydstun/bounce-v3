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
    it("should not show Package Deals link when visibility is false", () => {
      // Mock the context to return false for isVisible
      (usePackageDeals as jest.Mock).mockReturnValue({
        isVisible: false,
        setVisible: jest.fn(),
      });

      render(<Navigation />);

      // Verify Package Deals link is not present
      expect(screen.queryByText("Package Deals")).not.toBeInTheDocument();
    });

    it("should show Package Deals link when visibility is true", () => {
      // Mock the context to return true for isVisible
      (usePackageDeals as jest.Mock).mockReturnValue({
        isVisible: true,
        setVisible: jest.fn(),
      });

      render(<Navigation />);

      // Verify Package Deals link is present
      expect(screen.getByText("Package Deals")).toBeInTheDocument();
    });
  });

  describe("Footer Component", () => {
    it("should not show Package Deals link when visibility is false", () => {
      // Mock the context to return false for isVisible
      (usePackageDeals as jest.Mock).mockReturnValue({
        isVisible: false,
        setVisible: jest.fn(),
      });

      render(<Footer />);

      // Verify Package Deals link is not present
      expect(screen.queryByText("Package Deals")).not.toBeInTheDocument();
    });

    it("should show Package Deals link when visibility is true", () => {
      // Mock the context to return true for isVisible
      (usePackageDeals as jest.Mock).mockReturnValue({
        isVisible: true,
        setVisible: jest.fn(),
      });

      render(<Footer />);

      // Verify Package Deals link is present
      expect(screen.getByText("Package Deals")).toBeInTheDocument();
    });
  });
});
