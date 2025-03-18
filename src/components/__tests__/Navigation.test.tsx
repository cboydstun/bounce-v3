/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Navigation from "../Navigation";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe("Navigation", () => {
  it("renders navigation links", () => {
    render(<Navigation />);

    // Check if important navigation links are present
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });
});
