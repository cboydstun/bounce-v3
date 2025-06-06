/**
 * TaxIdInput Component Tests
 *
 * Unit tests for the TaxIdInput component to verify secure handling,
 * validation, and user interaction functionality.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import TaxIdInput from "../TaxIdInput";

// Mock the i18n hook
vi.mock("../../../hooks/common/useI18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

// Mock the quickbooks service
vi.mock("../../../services/quickbooks/quickbooksService", () => ({
  quickbooksService: {
    validateTaxId: vi.fn((taxId: string) => {
      const digits = taxId.replace(/\D/g, "");
      if (digits.length === 9) {
        return { isValid: true, format: "ssn", formatted: taxId };
      }
      return { isValid: false, format: "invalid", formatted: taxId };
    }),
  },
}));

describe("TaxIdInput Component", () => {
  const defaultProps = {
    value: "",
    onIonInput: vi.fn(),
    label: "Tax ID",
    required: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct label and placeholder", () => {
    render(<TaxIdInput {...defaultProps} />);

    expect(screen.getByText("Tax ID *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("XXX-XX-XXXX or XX-XXXXXXX"),
    ).toBeInTheDocument();
  });

  it("formats tax ID input correctly", async () => {
    const onIonInput = vi.fn();
    render(<TaxIdInput {...defaultProps} onIonInput={onIonInput} />);

    const input = screen.getByPlaceholderText("XXX-XX-XXXX or XX-XXXXXXX");

    // Simulate typing a tax ID
    fireEvent.input(input, { target: { value: "123456789" } });

    await waitFor(() => {
      expect(onIonInput).toHaveBeenCalledWith("123-45-6789");
    });
  });

  it("masks tax ID when not focused", () => {
    render(<TaxIdInput {...defaultProps} value="123-45-6789" />);

    const input = screen.getByDisplayValue("•••-••-••••");
    expect(input).toBeInTheDocument();
  });

  it("shows actual value when focused", async () => {
    render(<TaxIdInput {...defaultProps} value="123-45-6789" />);

    const input = screen.getByDisplayValue("•••-••-••••");

    // Focus the input
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByDisplayValue("123-45-6789")).toBeInTheDocument();
    });
  });

  it("shows validation success for valid tax ID", () => {
    render(<TaxIdInput {...defaultProps} value="123-45-6789" />);

    expect(screen.getByText("Valid SSN format")).toBeInTheDocument();
    expect(screen.getByLabelText("Valid tax ID")).toBeInTheDocument();
  });

  it("shows validation error for invalid tax ID", () => {
    render(<TaxIdInput {...defaultProps} value="123" />);

    expect(
      screen.getByText(
        "Invalid tax ID format. Use XXX-XX-XXXX (SSN) or XX-XXXXXXX (EIN)",
      ),
    ).toBeInTheDocument();
  });

  it("shows custom error message when provided", () => {
    const errorMessage = "Custom error message";
    render(<TaxIdInput {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("toggles value visibility when show/hide button is clicked", async () => {
    render(<TaxIdInput {...defaultProps} value="123-45-6789" />);

    // Initially masked
    expect(screen.getByDisplayValue("•••-••-••••")).toBeInTheDocument();

    // Click show button
    const showButton = screen.getByLabelText("Show tax ID");
    fireEvent.click(showButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("123-45-6789")).toBeInTheDocument();
    });

    // Click hide button
    const hideButton = screen.getByLabelText("Hide tax ID");
    fireEvent.click(hideButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("•••-••-••••")).toBeInTheDocument();
    });
  });

  it("limits input to 11 characters (formatted)", async () => {
    const onIonInput = vi.fn();
    render(<TaxIdInput {...defaultProps} onIonInput={onIonInput} />);

    const input = screen.getByPlaceholderText("XXX-XX-XXXX or XX-XXXXXXX");

    // Try to input more than 9 digits
    fireEvent.input(input, { target: { value: "12345678901234" } });

    await waitFor(() => {
      // Should be limited to 9 digits and formatted
      expect(onIonInput).toHaveBeenCalledWith("123-45-6789");
    });
  });

  it("handles disabled state correctly", () => {
    render(
      <TaxIdInput {...defaultProps} disabled={true} value="123-45-6789" />,
    );

    const input = screen.getByDisplayValue("•••-••-••••");
    expect(input).toBeDisabled();

    // Show/hide button should also be disabled
    const showButton = screen.getByLabelText("Show tax ID");
    expect(showButton).toBeDisabled();
  });

  it("provides proper accessibility attributes", () => {
    render(<TaxIdInput {...defaultProps} />);

    const input = screen.getByLabelText("Tax ID");
    expect(input).toHaveAttribute("aria-describedby", "Tax ID-helper");

    const helperText = screen.getByText(
      "Your tax ID is encrypted and securely stored",
    );
    expect(helperText).toHaveAttribute("id", "Tax ID-helper");
  });

  it("does not mask incomplete tax IDs", () => {
    render(<TaxIdInput {...defaultProps} value="123-45" />);

    // Should show actual value for incomplete tax IDs
    expect(screen.getByDisplayValue("123-45")).toBeInTheDocument();
  });

  it("handles empty value correctly", () => {
    render(<TaxIdInput {...defaultProps} value="" />);

    expect(
      screen.getByPlaceholderText("XXX-XX-XXXX or XX-XXXXXXX"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your tax ID is encrypted and securely stored"),
    ).toBeInTheDocument();
  });
});
