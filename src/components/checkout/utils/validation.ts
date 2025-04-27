import { CheckoutState, OrderStep } from "./types";

/**
 * Validate the current step of the checkout form
 * @param step The current step
 * @param state The current checkout state
 * @returns An object with error messages keyed by field name
 */
export const validateStep = (
  step: OrderStep,
  state: CheckoutState,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  switch (step) {
    case "delivery": // Rental Selection
      // We'll validate bouncer selection in the extras step
      // to allow extras-only orders

      if (!state.deliveryDate) {
        errors.deliveryDate = "Please select a delivery date";
      }

      if (state.deliveryTimePreference === "specific" && !state.deliveryTime) {
        errors.deliveryTime = "Please select a delivery time";
      }

      if (!state.pickupDate) {
        errors.pickupDate = "Please select a pickup date";
      }

      if (state.pickupTimePreference === "specific" && !state.pickupTime) {
        errors.pickupTime = "Please select a pickup time";
      }

      // Validate that delivery is before pickup
      if (state.deliveryDate && state.pickupDate) {
        const deliveryDateTime = new Date(
          `${state.deliveryDate}T${state.deliveryTime || "00:00"}`,
        );
        const pickupDateTime = new Date(
          `${state.pickupDate}T${state.pickupTime || "00:00"}`,
        );

        if (deliveryDateTime >= pickupDateTime) {
          errors.pickupDate =
            "Pickup date/time must be after delivery date/time";
        }
      }
      break;

    case "details": // Delivery Information
      // Validate customer name
      if (!state.customerName) {
        errors.customerName = "Please enter your name";
      }

      // Validate email
      if (!state.customerEmail) {
        errors.customerEmail = "Please enter your email";
      } else if (!validateEmail(state.customerEmail)) {
        errors.customerEmail = "Please enter a valid email address";
      }

      // Validate phone (optional but must be valid if provided)
      if (state.customerPhone && !validatePhone(state.customerPhone)) {
        errors.customerPhone =
          "Please enter a valid phone number in format (###)-###-####";
      }

      // Validate address
      if (!state.customerAddress) {
        errors.customerAddress = "Please enter your street address";
      }

      // Validate city
      if (!state.customerCity) {
        errors.customerCity = "Please enter your city";
      }

      // Validate state
      if (!state.customerState) {
        errors.customerState = "Please select your state";
      }

      // Validate zip code
      if (!state.customerZipCode) {
        errors.customerZipCode = "Please enter your zip code";
      } else if (!validateZipCode(state.customerZipCode)) {
        errors.customerZipCode = "Please enter a valid zip code";
      }

      // Validate Bexar County zip code
      if (
        state.customerZipCode &&
        validateZipCode(state.customerZipCode) &&
        !isBexarCountyZipCode(state.customerZipCode)
      ) {
        errors.customerZipCode =
          "We only deliver within Bexar County, TX. Please enter a valid Bexar County ZIP code.";
      }
      break;

    case "extras": // Extras
      // Ensure at least one item is selected (either bouncer or extras)
      if (
        !state.selectedBouncer &&
        !state.extras.some((extra) => extra.selected)
      ) {
        errors.extras =
          "Please select at least one item (bouncer or extras) to continue";
      }
      break;

    case "review": // Order Review
      // Validate terms agreement
      if (!state.agreedToTerms) {
        errors.agreedToTerms = "You must agree to the terms and conditions";
      }
      break;

    case "payment": // Payment
      // No validation needed for payment (handled by PayPal)
      break;
  }

  return errors;
};

/**
 * Validate email format
 * @param email The email to validate
 * @returns True if the email is valid
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate phone number format
 * @param phone The phone number to validate
 * @returns True if the phone number is valid
 */
export const validatePhone = (phone: string): boolean => {
  return /^\(\d{3}\)-\d{3}-\d{4}$/.test(phone);
};

/**
 * Validate zip code format
 * @param zipCode The zip code to validate
 * @returns True if the zip code is valid
 */
export const validateZipCode = (zipCode: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
};

/**
 * Check if a zip code is in Bexar County, TX
 * @param zipCode The zip code to check
 * @returns True if the zip code is in Bexar County
 */
export const isBexarCountyZipCode = (zipCode: string): boolean => {
  // List of Bexar County zip codes
  const bexarCountyZipCodes = [
    "78023",
    "78039",
    "78052",
    "78056",
    "78073",
    "78101",
    "78109",
    "78112",
    "78124",
    "78148",
    "78150",
    "78152",
    "78154",
    "78155",
    "78163",
    "78201",
    "78202",
    "78203",
    "78204",
    "78205",
    "78206",
    "78207",
    "78208",
    "78209",
    "78210",
    "78211",
    "78212",
    "78213",
    "78214",
    "78215",
    "78216",
    "78217",
    "78218",
    "78219",
    "78220",
    "78221",
    "78222",
    "78223",
    "78224",
    "78225",
    "78226",
    "78227",
    "78228",
    "78229",
    "78230",
    "78231",
    "78232",
    "78233",
    "78234",
    "78235",
    "78236",
    "78237",
    "78238",
    "78239",
    "78240",
    "78241",
    "78242",
    "78243",
    "78244",
    "78245",
    "78246",
    "78247",
    "78248",
    "78249",
    "78250",
    "78251",
    "78252",
    "78253",
    "78254",
    "78255",
    "78256",
    "78257",
    "78258",
    "78259",
    "78260",
    "78261",
    "78263",
    "78264",
    "78265",
    "78266",
    "78268",
    "78269",
    "78270",
    "78275",
    "78278",
    "78279",
    "78280",
    "78283",
    "78284",
    "78285",
    "78286",
    "78287",
    "78288",
    "78289",
    "78291",
    "78292",
    "78293",
    "78294",
    "78295",
    "78296",
    "78297",
    "78298",
    "78299",
  ];

  // Extract the 5-digit zip code
  const fiveDigitZip = zipCode.substring(0, 5);

  return bexarCountyZipCodes.includes(fiveDigitZip);
};

/**
 * Validate delivery time (8:00 AM to 6:00 PM)
 * @param time The time to validate in HH:MM format
 * @returns True if the time is valid
 */
export const validateDeliveryTime = (time: string): boolean => {
  // If time is "ANY", it's valid
  if (time === "ANY") return true;

  // Parse the time
  const [hours, minutes] = time.split(":").map(Number);

  // Check if time is between 8:00 AM and 6:00 PM
  return hours >= 8 && hours <= 18;
};

/**
 * Get the next day from a given date
 * @param date The date to get the next day from
 * @returns The next day
 */
export const getNextDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
};

/**
 * Format a phone number as (###)-###-####
 * @param value The input phone number
 * @returns The formatted phone number
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, "");

  // Format as (###)-###-####
  if (numbers.length >= 10) {
    return `(${numbers.slice(0, 3)})-${numbers.slice(3, 6)}-${numbers.slice(
      6,
      10,
    )}`;
  } else if (numbers.length >= 6) {
    return `(${numbers.slice(0, 3)})-${numbers.slice(3, 6)}-${numbers.slice(
      6,
    )}`;
  } else if (numbers.length >= 3) {
    return `(${numbers.slice(0, 3)})-${numbers.slice(3)}`;
  }
  return numbers;
};
