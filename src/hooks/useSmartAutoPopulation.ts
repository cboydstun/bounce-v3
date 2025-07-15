import { useCallback } from "react";
import { ContactFormData } from "@/types/contact";

/**
 * Custom hook for smart auto-population of form fields
 * @param formData - Current form data
 * @returns Object with auto-population functions
 */
export function useSmartAutoPopulation(formData: ContactFormData) {
  // Helper function to add hours to a time string
  const addHoursToTime = useCallback(
    (timeString: string, hours: number): string => {
      if (!timeString) return "";

      const [hourStr, minuteStr] = timeString.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      let newHour = hour + hours;
      let newMinute = minute;

      // Handle hour overflow/underflow
      if (newHour >= 24) {
        newHour = newHour - 24;
      } else if (newHour < 0) {
        newHour = 24 + newHour;
      }

      return `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
    },
    [],
  );

  // Helper function to add days to a date string
  const addDaysToDate = useCallback(
    (dateString: string, days: number): string => {
      if (!dateString) return "";

      const date = new Date(dateString);
      date.setDate(date.getDate() + days);

      return date.toISOString().split("T")[0];
    },
    [],
  );

  // Helper function to check if a date is a weekend
  const isWeekend = useCallback((dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }, []);

  // Helper function to get the previous Friday for weekend parties
  const getPreviousWeekday = useCallback((dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    // If it's Saturday (6), go back 1 day to Friday
    // If it's Sunday (0), go back 2 days to Friday
    let daysToSubtract = 0;
    if (dayOfWeek === 6) {
      // Saturday
      daysToSubtract = 1;
    } else if (dayOfWeek === 0) {
      // Sunday
      daysToSubtract = 2;
    }

    if (daysToSubtract > 0) {
      date.setDate(date.getDate() - daysToSubtract);
    }

    return date.toISOString().split("T")[0];
  }, []);

  // Auto-populate delivery day when party date changes
  const getPartyDateUpdates = useCallback(
    (
      newPartyDate: string,
      currentFormData: ContactFormData,
    ): Partial<ContactFormData> => {
      const updates: Partial<ContactFormData> = {
        partyDate: newPartyDate,
      };

      if (newPartyDate) {
        // Set delivery day - use previous weekday if party is on weekend
        const deliveryDay = isWeekend(newPartyDate)
          ? getPreviousWeekday(newPartyDate)
          : newPartyDate;

        updates.deliveryDay = deliveryDay;

        // Set pickup day - day after party date
        updates.pickupDay = addDaysToDate(newPartyDate, 1);

        // If party start time exists, set delivery time 2 hours before
        if (currentFormData.partyStartTime) {
          updates.deliveryTime = addHoursToTime(
            currentFormData.partyStartTime,
            -2,
          );
        }

        // If party end time exists, set pickup time 2 hours after
        if (currentFormData.partyEndTime) {
          updates.pickupTime = addHoursToTime(currentFormData.partyEndTime, 2);
        }
      }

      return updates;
    },
    [isWeekend, getPreviousWeekday, addDaysToDate, addHoursToTime],
  );

  // Auto-populate delivery time when party start time changes
  const getPartyStartTimeUpdates = useCallback(
    (newStartTime: string): Partial<ContactFormData> => {
      const updates: Partial<ContactFormData> = {
        partyStartTime: newStartTime,
      };

      if (newStartTime) {
        // Set delivery time 2 hours before party start
        updates.deliveryTime = addHoursToTime(newStartTime, -2);
      }

      return updates;
    },
    [addHoursToTime],
  );

  // Auto-populate pickup time when party end time changes
  const getPartyEndTimeUpdates = useCallback(
    (newEndTime: string): Partial<ContactFormData> => {
      const updates: Partial<ContactFormData> = {
        partyEndTime: newEndTime,
      };

      if (newEndTime) {
        // Set pickup time 2 hours after party end
        updates.pickupTime = addHoursToTime(newEndTime, 2);
      }

      return updates;
    },
    [addHoursToTime],
  );

  // Smart defaults for new forms
  const getSmartDefaults = useCallback(
    (currentFormData: ContactFormData): Partial<ContactFormData> => {
      const updates: Partial<ContactFormData> = {};

      // Only update fields that are actually empty to prevent unnecessary re-renders
      if (!currentFormData.partyStartTime) {
        updates.partyStartTime = "12:00"; // Default to noon
      }

      if (!currentFormData.partyEndTime) {
        updates.partyEndTime = "16:00"; // Default to 4 PM (4 hour party)
      }

      // Set default state if not set
      if (!currentFormData.state) {
        updates.state = "Texas";
      }

      return updates;
    },
    [],
  );

  // Validate time logic and show warnings
  const validateTimeLogic = useCallback(() => {
    const warnings: string[] = [];

    if (formData.partyStartTime && formData.partyEndTime) {
      const startHour = parseInt(formData.partyStartTime.split(":")[0], 10);
      const endHour = parseInt(formData.partyEndTime.split(":")[0], 10);

      if (endHour <= startHour) {
        warnings.push("Party end time should be after start time");
      }
    }

    if (formData.deliveryTime && formData.partyStartTime) {
      const deliveryHour = parseInt(formData.deliveryTime.split(":")[0], 10);
      const partyHour = parseInt(formData.partyStartTime.split(":")[0], 10);

      if (deliveryHour >= partyHour) {
        warnings.push("Delivery should be before party start time");
      }
    }

    if (formData.pickupTime && formData.partyEndTime) {
      const pickupHour = parseInt(formData.pickupTime.split(":")[0], 10);
      const partyEndHour = parseInt(formData.partyEndTime.split(":")[0], 10);

      if (pickupHour <= partyEndHour) {
        warnings.push("Pickup should be after party end time");
      }
    }

    if (formData.deliveryDay && formData.pickupDay) {
      const deliveryDate = new Date(formData.deliveryDay);
      const pickupDate = new Date(formData.pickupDay);

      if (pickupDate <= deliveryDate) {
        warnings.push("Pickup day should be after delivery day");
      }
    }

    return warnings;
  }, [formData]);

  return {
    getPartyDateUpdates,
    getPartyStartTimeUpdates,
    getPartyEndTimeUpdates,
    getSmartDefaults,
    validateTimeLogic,
    addHoursToTime,
    addDaysToDate,
    isWeekend,
  };
}
