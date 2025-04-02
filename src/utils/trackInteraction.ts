/**
 * Utility functions for tracking user interactions
 */

import { InteractionType } from "@/types/visitor";

/**
 * Track a user interaction
 * @param type The type of interaction
 * @param element The element that was interacted with (e.g., button ID, form ID)
 * @param page Optional page where the interaction occurred (defaults to current page)
 * @param data Optional additional data about the interaction
 */
export const trackInteraction = async (
  type: InteractionType,
  element: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  try {
    // Get visitor ID from localStorage if available
    const visitorId = localStorage.getItem("visitorId");

    if (!visitorId) {
      console.warn("Cannot track interaction: No visitor ID found");
      return;
    }

    // Get current page if not provided
    const currentPage = page || window.location.pathname;

    // Create interaction data
    const interaction = {
      type,
      element,
      page: currentPage,
      data,
    };

    // Send to API
    await fetch("/api/v1/visitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        currentPage,
        interaction,
      }),
    });
  } catch (error) {
    console.error("Error tracking interaction:", error);
  }
};

/**
 * Track a click interaction
 * @param element The element that was clicked
 * @param page Optional page where the click occurred
 * @param data Optional additional data about the click
 */
export const trackClick = async (
  element: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  return trackInteraction("click", element, page, data);
};

/**
 * Track a scroll interaction
 * @param depth The scroll depth (e.g., '50%', '100%')
 * @param page Optional page where the scroll occurred
 */
export const trackScroll = async (
  depth: string,
  page?: string,
): Promise<void> => {
  return trackInteraction("scroll", `scroll-${depth}`, page, { depth });
};

/**
 * Track a form start interaction (user started filling out a form)
 * @param formId The ID of the form
 * @param page Optional page where the form is located
 */
export const trackFormStart = async (
  formId: string,
  page?: string,
): Promise<void> => {
  return trackInteraction("form_start", formId, page);
};

/**
 * Track a form submission interaction
 * @param formId The ID of the form
 * @param page Optional page where the form is located
 * @param data Optional form data (be careful not to include sensitive information)
 */
export const trackFormSubmit = async (
  formId: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  return trackInteraction("form_submit", formId, page, data);
};

/**
 * Track a video play interaction
 * @param videoId The ID of the video
 * @param page Optional page where the video is located
 * @param data Optional additional data (e.g., video title, duration)
 */
export const trackVideoPlay = async (
  videoId: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  return trackInteraction("video_play", videoId, page, data);
};

/**
 * Track a gallery view interaction
 * @param galleryId The ID of the gallery
 * @param page Optional page where the gallery is located
 * @param data Optional additional data (e.g., image index)
 */
export const trackGalleryView = async (
  galleryId: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  return trackInteraction("gallery_view", galleryId, page, data);
};

/**
 * Track a product view interaction
 * @param productId The ID or slug of the product
 * @param page Optional page where the product is viewed
 * @param data Optional additional data (e.g., product name, category)
 */
export const trackProductView = async (
  productId: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  return trackInteraction("product_view", productId, page, data);
};

/**
 * Track a price check interaction
 * @param productId The ID or slug of the product
 * @param page Optional page where the price check occurred
 * @param data Optional additional data (e.g., price, options selected)
 */
export const trackPriceCheckInteraction = async (
  productId: string,
  page?: string,
  data?: Record<string, any>,
): Promise<void> => {
  return trackInteraction("price_check", productId, page, data);
};

/**
 * Track client-side errors
 * @param error The error object or message
 * @param url The URL where the error occurred
 */
export const trackClientError = async (
  error: Error | string,
  url?: string,
): Promise<void> => {
  try {
    // Get visitor ID from localStorage if available
    const visitorId = localStorage.getItem("visitorId");

    if (!visitorId) {
      console.warn("Cannot track error: No visitor ID found");
      return;
    }

    // Get current page if not provided
    const currentPage = url || window.location.href;

    // Format error data
    const errorMessage = error instanceof Error ? error.message : error;
    const errorType = error instanceof Error ? error.name : "Unknown";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Create client error data
    const clientError = {
      type: errorType,
      message: errorMessage,
      url: currentPage,
      stack: errorStack,
    };

    // Send to API
    await fetch("/api/v1/visitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        currentPage,
        clientError,
      }),
    });
  } catch (trackingError) {
    console.error("Error tracking client error:", trackingError);
  }
};

/**
 * Set up global error tracking
 * This should be called once at application startup
 */
export const setupErrorTracking = (): void => {
  if (typeof window !== "undefined") {
    // Store the original error handler
    const originalOnError = window.onerror;

    // Set up a new error handler
    window.onerror = (message, source, lineno, colno, error) => {
      // Track the error
      trackClientError(error || String(message), source);

      // Call the original error handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }

      // Return false to allow the default error handling
      return false;
    };

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      trackClientError(event.reason || "Unhandled Promise Rejection");
    });
  }
};
