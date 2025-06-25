import {
  isValidCustomerName,
  getValidatedCustomerName,
  formatDisplayName,
} from "../nameUtils";

describe("nameUtils", () => {
  describe("isValidCustomerName", () => {
    it("should validate proper customer names", () => {
      expect(isValidCustomerName("John Smith")).toBe(true);
      expect(isValidCustomerName("Mary Johnson")).toBe(true);
      expect(isValidCustomerName("Bob")).toBe(true);
      expect(isValidCustomerName("Jean-Pierre")).toBe(true);
    });

    it("should reject invalid names", () => {
      expect(isValidCustomerName("")).toBe(false);
      expect(isValidCustomerName("   ")).toBe(false);
      expect(isValidCustomerName(null)).toBe(false);
      expect(isValidCustomerName(undefined)).toBe(false);
      expect(isValidCustomerName("a")).toBe(false); // Too short
      expect(isValidCustomerName("123")).toBe(false); // No letters
    });
  });

  describe("getValidatedCustomerName", () => {
    it("should return formatted valid names", () => {
      expect(getValidatedCustomerName("john smith")).toBe("John Smith");
      expect(getValidatedCustomerName("MARY JOHNSON")).toBe("Mary Johnson");
      expect(getValidatedCustomerName("Bob Wilson")).toBe("Bob Wilson");
    });

    it("should return null for invalid names", () => {
      expect(getValidatedCustomerName("")).toBe(null);
      expect(getValidatedCustomerName("   ")).toBe(null);
      expect(getValidatedCustomerName(null)).toBe(null);
      expect(getValidatedCustomerName(undefined)).toBe(null);
      expect(getValidatedCustomerName("a")).toBe(null);
      expect(getValidatedCustomerName("123")).toBe(null);
    });
  });

  describe("formatDisplayName", () => {
    it("should format names properly", () => {
      expect(formatDisplayName("john smith")).toBe("John Smith");
      expect(formatDisplayName("MARY JOHNSON")).toBe("Mary Johnson");
      expect(formatDisplayName("bob WILSON")).toBe("Bob Wilson");
    });

    it("should handle edge cases", () => {
      expect(formatDisplayName("")).toBe("Valued Customer");
      expect(formatDisplayName("   ")).toBe("Valued Customer");
    });
  });
});
