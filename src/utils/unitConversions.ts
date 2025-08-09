/**
 * Unit conversion utilities for distance measurements
 */

export type DistanceUnit = "miles" | "kilometers";

/**
 * Convert meters to miles
 * @param meters Distance in meters
 * @returns Distance in miles
 */
export const metersToMiles = (meters: number): number => {
  return meters * 0.000621371;
};

/**
 * Convert meters to kilometers
 * @param meters Distance in meters
 * @returns Distance in kilometers
 */
export const metersToKilometers = (meters: number): number => {
  return meters / 1000;
};

/**
 * Format distance with appropriate units and precision
 * @param meters Distance in meters
 * @param units Target unit system
 * @param precision Number of decimal places (default: 2)
 * @returns Formatted distance string with units
 */
export const formatDistance = (
  meters: number,
  units: DistanceUnit,
  precision: number = 2,
): string => {
  if (units === "miles") {
    const miles = metersToMiles(meters);
    return `${miles.toFixed(precision)} mi`;
  } else {
    const kilometers = metersToKilometers(meters);
    return `${kilometers.toFixed(precision)} km`;
  }
};

/**
 * Get the numeric value of distance in the specified units
 * @param meters Distance in meters
 * @param units Target unit system
 * @returns Numeric distance value
 */
export const getDistanceValue = (
  meters: number,
  units: DistanceUnit,
): number => {
  if (units === "miles") {
    return metersToMiles(meters);
  } else {
    return metersToKilometers(meters);
  }
};

/**
 * Get the unit abbreviation
 * @param units Unit system
 * @returns Unit abbreviation string
 */
export const getUnitAbbreviation = (units: DistanceUnit): string => {
  return units === "miles" ? "mi" : "km";
};

/**
 * Get the unit name (full word)
 * @param units Unit system
 * @returns Unit name string
 */
export const getUnitName = (units: DistanceUnit): string => {
  return units === "miles" ? "Miles" : "Kilometers";
};

/**
 * Convert duration from seconds to a human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes} min`;
  }
};

/**
 * Save user's preferred units to localStorage
 * @param units Preferred unit system
 */
export const saveUnitsPreference = (units: DistanceUnit): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("preferredUnits", units);
  }
};

/**
 * Load user's preferred units from localStorage
 * @returns Saved unit preference or default to miles
 */
export const loadUnitsPreference = (): DistanceUnit => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("preferredUnits");
    if (saved === "miles" || saved === "kilometers") {
      return saved;
    }
  }
  return "miles"; // Default to miles for US users
};
