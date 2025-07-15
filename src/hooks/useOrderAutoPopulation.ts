import { useCallback } from "react";

interface OrderFormData {
  eventDate?: string;
  deliveryDate?: string;
  customerState?: string;
  [key: string]: any;
}

/**
 * Custom hook for smart auto-population of order form fields
 * @param formData - Current form data
 * @param setFormData - Function to update form data
 * @returns Object with auto-population functions
 */
export function useOrderAutoPopulation(
  formData: OrderFormData,
  setFormData: React.Dispatch<React.SetStateAction<OrderFormData>>,
) {
  // Helper function to add hours to a datetime-local string
  const addHoursToDateTime = useCallback(
    (dateTimeString: string, hours: number): string => {
      if (!dateTimeString) return "";

      const date = new Date(dateTimeString);
      date.setHours(date.getHours() + hours);

      // Format back to datetime-local format (YYYY-MM-DDTHH:MM)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hour}:${minute}`;
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

  // Helper function to get the previous Friday for weekend events
  const getPreviousWeekday = useCallback((dateTimeString: string): string => {
    if (!dateTimeString) return "";

    const date = new Date(dateTimeString);
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

    // Keep the same time but on the adjusted date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${minute}`;
  }, []);

  // Auto-populate delivery date when event date changes
  const handleEventDateChange = useCallback(
    (newEventDate: string) => {
      setFormData((prev) => {
        const updates: Partial<OrderFormData> = {
          eventDate: newEventDate,
        };

        if (newEventDate && !prev.deliveryDate) {
          // Set delivery date/time - use previous weekday if event is on weekend
          // Default to 2 hours before event time
          const deliveryDateTime = isWeekend(newEventDate)
            ? getPreviousWeekday(addHoursToDateTime(newEventDate, -2))
            : addHoursToDateTime(newEventDate, -2);

          updates.deliveryDate = deliveryDateTime;
        }

        return { ...prev, ...updates };
      });
    },
    [setFormData, isWeekend, getPreviousWeekday, addHoursToDateTime],
  );

  // Smart defaults for new orders
  const applySmartDefaults = useCallback(() => {
    setFormData((prev) => {
      const updates: Partial<OrderFormData> = {};

      // Set default state if not set
      if (!prev.customerState) {
        updates.customerState = "Texas";
      }

      // Set default event time if event date is set but no time
      if (prev.eventDate && !prev.eventDate.includes("T")) {
        updates.eventDate = `${prev.eventDate}T12:00`; // Default to noon
      }

      return { ...prev, ...updates };
    });
  }, [setFormData]);

  // Validate date/time logic and show warnings
  const validateDateTimeLogic = useCallback(() => {
    const warnings: string[] = [];

    if (formData.deliveryDate && formData.eventDate) {
      const deliveryDate = new Date(formData.deliveryDate);
      const eventDate = new Date(formData.eventDate);

      if (deliveryDate > eventDate) {
        warnings.push("Delivery date should be before or on event date");
      }

      // Check if delivery is too close to event (less than 1 hour)
      const timeDiff = eventDate.getTime() - deliveryDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 1 && hoursDiff > 0) {
        warnings.push(
          "Delivery time is very close to event time (less than 1 hour)",
        );
      }
    }

    return warnings;
  }, [formData]);

  // Auto-populate customer info from contact ID (if available)
  const populateFromContact = useCallback(
    async (contactId: string) => {
      // This would typically fetch contact data from API
      // For now, we'll just provide the structure
      try {
        // const contactData = await getContactById(contactId);
        // setFormData(prev => ({
        //   ...prev,
        //   customerName: contactData.customerName,
        //   customerEmail: contactData.email,
        //   customerPhone: contactData.phone,
        //   customerAddress: contactData.streetAddress,
        //   customerCity: contactData.city,
        //   customerState: contactData.state,
        //   customerZipCode: contactData.partyZipCode,
        //   eventDate: contactData.partyDate,
        // }));
      } catch (error) {
        console.error("Error fetching contact data:", error);
      }
    },
    [setFormData],
  );

  return {
    handleEventDateChange,
    applySmartDefaults,
    validateDateTimeLogic,
    populateFromContact,
    addHoursToDateTime,
    isWeekend,
  };
}
