import { getDateRangeForPeriod, calculateRevenueData } from "../analytics";
import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";

describe("analytics utility functions", () => {
  describe("getDateRangeForPeriod", () => {
    beforeEach(() => {
      // Mock the current date to be April 10, 2025
      jest.useFakeTimers().setSystemTime(new Date("2025-04-10"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("should return correct date range for currentMonth", () => {
      const result = getDateRangeForPeriod("currentMonth");
      // Get the expected dates based on the current implementation
      const now = new Date("2025-04-10");
      const startDate = new Date(now);
      startDate.setDate(1);
      const endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 1, 0);

      const expectedStartDate = startDate.toISOString().split("T")[0];
      const expectedEndDate = endDate.toISOString().split("T")[0];

      expect(result.startDate).toBe(expectedStartDate);
      expect(result.endDate).toBe(expectedEndDate);
    });

    test("should return correct date range for nextMonth", () => {
      const result = getDateRangeForPeriod("nextMonth");
      // Now we expect May 2025 (current year's next month)
      const now = new Date("2025-04-10");
      const startDate = new Date(now);
      startDate.setMonth(now.getMonth() + 1, 1);
      const endDate = new Date(now);
      endDate.setMonth(now.getMonth() + 2, 0);

      const expectedStartDate = startDate.toISOString().split("T")[0];
      const expectedEndDate = endDate.toISOString().split("T")[0];

      expect(result.startDate).toBe(expectedStartDate);
      expect(result.endDate).toBe(expectedEndDate);
    });

    test("should return correct date range for last30Days", () => {
      const result = getDateRangeForPeriod("last30Days");
      expect(result.startDate).toBe("2025-03-11");
      expect(result.endDate).toBe("2025-04-10");
    });
  });

  describe("calculateRevenueData", () => {
    test("should correctly calculate revenue data", () => {
      // Sample contacts data
      const contacts: Contact[] = [
        {
          _id: "1",
          bouncer: "Product 1",
          email: "test1@example.com",
          partyDate: new Date("2025-04-05"),
          partyZipCode: "12345",
          confirmed: "Confirmed",
          sourcePage: "website",
        },
        {
          _id: "2",
          bouncer: "Product 2",
          email: "test2@example.com",
          partyDate: new Date("2025-04-10"),
          partyZipCode: "12345",
          confirmed: "Confirmed",
          sourcePage: "website",
        },
        {
          _id: "3",
          bouncer: "Product 1",
          email: "test3@example.com",
          partyDate: new Date("2025-04-15"),
          partyZipCode: "12345",
          confirmed: "Confirmed",
          sourcePage: "website",
        },
      ];

      // Sample products data
      const products: ProductWithId[] = [
        {
          _id: "1",
          name: "Product 1",
          slug: "product-1",
          description: "Description 1",
          category: "Category 1",
          price: { base: 100, currency: "USD" },
          rentalDuration: "full-day",
          availability: "available",
          images: [],
          specifications: [],
          dimensions: { length: 10, width: 10, height: 10, unit: "ft" },
          capacity: 10,
          ageRange: { min: 3, max: 12 },
          setupRequirements: {
            space: "10x10",
            powerSource: true,
            surfaceType: ["grass"],
          },
          features: [],
          safetyGuidelines: "Safety guidelines",
          weatherRestrictions: [],
        },
        {
          _id: "2",
          name: "Product 2",
          slug: "product-2",
          description: "Description 2",
          category: "Category 2",
          price: { base: 150, currency: "USD" },
          rentalDuration: "full-day",
          availability: "available",
          images: [],
          specifications: [],
          dimensions: { length: 10, width: 10, height: 10, unit: "ft" },
          capacity: 10,
          ageRange: { min: 3, max: 12 },
          setupRequirements: {
            space: "10x10",
            powerSource: true,
            surfaceType: ["grass"],
          },
          features: [],
          safetyGuidelines: "Safety guidelines",
          weatherRestrictions: [],
        },
      ];

      // Calculate revenue data
      const result = calculateRevenueData(contacts, products, "currentMonth");

      // Verify the result
      expect(result.chartData.labels).toHaveLength(3);
      expect(result.chartData.datasets[0].data).toHaveLength(3);
      expect(result.total).toBe(350); // 100 + 150 + 100
    });

    test("should handle missing product data", () => {
      // Sample contacts data with a product that doesn't exist
      const contacts: Contact[] = [
        {
          _id: "1",
          bouncer: "Product 1",
          email: "test1@example.com",
          partyDate: new Date("2025-04-05"),
          partyZipCode: "12345",
          confirmed: "Confirmed",
          sourcePage: "website",
        },
        {
          _id: "2",
          bouncer: "Non-existent Product",
          email: "test2@example.com",
          partyDate: new Date("2025-04-10"),
          partyZipCode: "12345",
          confirmed: "Confirmed",
          sourcePage: "website",
        },
      ];

      // Sample products data
      const products: ProductWithId[] = [
        {
          _id: "1",
          name: "Product 1",
          slug: "product-1",
          description: "Description 1",
          category: "Category 1",
          price: { base: 100, currency: "USD" },
          rentalDuration: "full-day",
          availability: "available",
          images: [],
          specifications: [],
          dimensions: { length: 10, width: 10, height: 10, unit: "ft" },
          capacity: 10,
          ageRange: { min: 3, max: 12 },
          setupRequirements: {
            space: "10x10",
            powerSource: true,
            surfaceType: ["grass"],
          },
          features: [],
          safetyGuidelines: "Safety guidelines",
          weatherRestrictions: [],
        },
      ];

      // Calculate revenue data
      const result = calculateRevenueData(contacts, products, "currentMonth");

      // Verify the result
      expect(result.chartData.labels).toHaveLength(2);
      expect(result.chartData.datasets[0].data).toHaveLength(2);
      expect(result.total).toBe(100); // Only the first product is found, the second one returns 0
    });

    test("should not log warnings during test execution", () => {
      // Mock console.warn to capture calls
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Sample contacts data with a product that doesn't exist
      const contacts: Contact[] = [
        {
          _id: "1",
          bouncer: "Non-existent Product",
          email: "test1@example.com",
          partyDate: new Date("2025-04-05"),
          partyZipCode: "12345",
          confirmed: "Confirmed",
          sourcePage: "website",
        },
      ];

      // Empty products array to ensure no match
      const products: ProductWithId[] = [];

      // Calculate revenue data
      calculateRevenueData(contacts, products, "currentMonth");

      // Verify that console.warn was not called during test execution
      expect(consoleSpy).not.toHaveBeenCalled();

      // Restore console.warn
      consoleSpy.mockRestore();
    });
  });
});
