/**
 * Utility functions for validating and formatting customer names
 */

/**
 * Validate if a customer name is valid for personalized emails
 * @param customerName The customer name to validate
 * @returns true if the name is valid for use in personalized emails
 */
export function isValidCustomerName(customerName?: string | null): boolean {
  if (!customerName || typeof customerName !== "string") {
    return false;
  }

  const trimmedName = customerName.trim();

  // Must have content and be at least 2 characters
  if (!trimmedName || trimmedName.length < 2) {
    return false;
  }

  // Must contain at least one letter (not just numbers/symbols)
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return false;
  }

  return true;
}

/**
 * Get a validated customer name or null if invalid
 * @param customerName Direct customer name field from database
 * @returns The validated customer name or null if invalid
 */
export function getValidatedCustomerName(
  customerName?: string | null,
): string | null {
  if (!isValidCustomerName(customerName)) {
    return null;
  }

  return formatDisplayName(customerName!);
}

/**
 * Format a name for display (capitalize properly)
 * @param name The name to format
 * @returns Properly formatted name
 */
export function formatDisplayName(name: string): string {
  if (!name || typeof name !== "string") {
    return "Valued Customer";
  }

  return (
    name
      .split(" ")
      .map((word) => {
        if (word.length === 0) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ")
      .trim() || "Valued Customer"
  );
}
