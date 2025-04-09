import { Holiday } from "../types/promo";

export const getCurrentPromotion = (
  holidays: Holiday[],
  currentDate: Date = new Date(),
): Holiday | null => {
  // Find the holiday that matches the current date
  const matchingHoliday = holidays.find((holiday) => {
    const startDate = new Date(holiday.startDate);
    const endDate = new Date(holiday.endDate);

    // Set time to beginning/end of day for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Check if current date is within the holiday date range
    return currentDate >= startDate && currentDate <= endDate;
  });

  return matchingHoliday || null;
};
