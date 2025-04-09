/**
 * Utility functions for managing cookies related to feature visibility
 */

const PACKAGE_DEALS_COOKIE = "package_deals_visible";

/**
 * Check if the package deals should be visible based on cookie
 * @returns boolean indicating if package deals should be visible
 */
export const isPackageDealsVisible = (): boolean => {
  // Only run on client side
  if (typeof window === "undefined") return false;

  return document.cookie.includes(`${PACKAGE_DEALS_COOKIE}=true`);
};

/**
 * Set the cookie to make package deals visible
 * @param days Number of days the cookie should persist
 */
export const setPackageDealsVisible = (days: number = 365): void => {
  // Only run on client side
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  document.cookie = `${PACKAGE_DEALS_COOKIE}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
};
