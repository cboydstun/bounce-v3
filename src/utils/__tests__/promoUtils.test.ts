import { getCurrentPromotion } from "../promoUtils";
import { Holiday } from "../../types/promo";

describe("getCurrentPromotion", () => {
  const mockHolidays: Holiday[] = [
    {
      name: "Test Holiday 1",
      startDate: "2025-01-01",
      endDate: "2025-01-10",
      message: "Test message 1",
    },
    {
      name: "Test Holiday 2",
      startDate: "2025-03-15",
      endDate: "2025-03-25",
      message: "Test message 2",
    },
  ];

  it("should return the correct holiday when date is within range", () => {
    const testDate = new Date("2025-01-05");
    const result = getCurrentPromotion(mockHolidays, testDate);
    expect(result).toEqual(mockHolidays[0]);
  });

  it("should return null when no holiday matches the date", () => {
    const testDate = new Date("2025-02-01");
    const result = getCurrentPromotion(mockHolidays, testDate);
    expect(result).toBeNull();
  });

  it("should include the start date in the range", () => {
    const testDate = new Date("2025-01-01");
    const result = getCurrentPromotion(mockHolidays, testDate);
    expect(result).toEqual(mockHolidays[0]);
  });

  it("should include the end date in the range", () => {
    const testDate = new Date("2025-01-10");
    const result = getCurrentPromotion(mockHolidays, testDate);
    expect(result).toEqual(mockHolidays[0]);
  });
});
