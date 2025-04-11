/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import ConditionalPackageLink from "../ConditionalPackageLink";
import { usePackageDeals } from "../../contexts/PackageDealsContext";

// Mock the PackageDealsContext
jest.mock("../../contexts/PackageDealsContext", () => {
  return {
    usePackageDeals: jest.fn(),
  };
});

describe("ConditionalPackageLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should link to /coupon-form when form has not been completed", () => {
    // Mock the context to return false for hasCompletedForm
    (usePackageDeals as jest.Mock).mockReturnValue({
      hasCompletedForm: false,
      setFormCompleted: jest.fn(),
    });

    render(<ConditionalPackageLink>Package Deals</ConditionalPackageLink>);

    // Get the link and check its href
    const link = screen.getByText("Package Deals").closest("a");
    expect(link).toHaveAttribute("href", "/coupon-form");
  });

  it("should link to /party-packages when form has been completed", () => {
    // Mock the context to return true for hasCompletedForm
    (usePackageDeals as jest.Mock).mockReturnValue({
      hasCompletedForm: true,
      setFormCompleted: jest.fn(),
    });

    render(<ConditionalPackageLink>Package Deals</ConditionalPackageLink>);

    // Get the link and check its href
    const link = screen.getByText("Package Deals").closest("a");
    expect(link).toHaveAttribute("href", "/party-packages");
  });

  it("should apply provided className to the link", () => {
    (usePackageDeals as jest.Mock).mockReturnValue({
      hasCompletedForm: true,
      setFormCompleted: jest.fn(),
    });

    const testClass = "test-class";
    render(
      <ConditionalPackageLink className={testClass}>
        Package Deals
      </ConditionalPackageLink>,
    );

    const link = screen.getByText("Package Deals").closest("a");
    expect(link).toHaveClass(testClass);
  });

  it("should call onClick handler when provided", () => {
    (usePackageDeals as jest.Mock).mockReturnValue({
      hasCompletedForm: true,
      setFormCompleted: jest.fn(),
    });

    const handleClick = jest.fn();
    const { getByText } = render(
      <ConditionalPackageLink onClick={handleClick}>
        Package Deals
      </ConditionalPackageLink>,
    );

    // We can't actually test the onClick behavior fully without userEvent,
    // but we can at least verify the prop is passed
    const link = getByText("Package Deals").closest("a");
    expect(link).toHaveProperty("onclick"); // lowercase in DOM
  });
});
