"use client";

import { useEffect, useRef, useState } from "react";
import { OrderStep, CheckoutState } from "./utils/types";
import { trackInteraction } from "@/utils/trackInteraction";

interface OrderFormTrackerProps {
  currentStep: OrderStep;
  formData: CheckoutState;
}

/**
 * Component to track user progress through the checkout form
 * This is a client-side only component that doesn't render anything
 * Enhanced with thumbprint.js integration for detailed visitor tracking
 */
const OrderFormTracker: React.FC<OrderFormTrackerProps> = ({
  currentStep,
  formData,
}) => {
  // Store previous step to detect changes
  const prevStepRef = useRef<OrderStep | null>(null);
  // Store start time to calculate time spent on step
  const stepStartTimeRef = useRef<number>(Date.now());
  // Store a flag to detect if the user abandons the form
  const formActiveRef = useRef<boolean>(true);

  // Track if we've already recorded a completion for this session
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);

  // Retry failed tracking events on mount
  useEffect(() => {
    const retryFailedEvents = async () => {
      try {
        const checkoutEvents = localStorage.getItem("failedTracking_checkout");
        const conversionEvents = localStorage.getItem(
          "failedTracking_conversion",
        );

        if (checkoutEvents) {
          const events = JSON.parse(checkoutEvents);
          for (const event of events) {
            if (event.retryCount < 3) {
              console.log("Retrying failed checkout event:", event.type);
              await trackCheckoutEvent(
                event.type,
                event.data,
                event.retryCount + 1,
              );
            }
          }
        }

        if (conversionEvents) {
          const events = JSON.parse(conversionEvents);
          for (const event of events) {
            if (event.retryCount < 3) {
              console.log("Retrying failed conversion event:", event.type);
              await trackConversionEvent(
                event.type,
                event.data,
                event.retryCount + 1,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error retrying failed events:", error);
      }
    };

    // Retry failed events after a short delay to allow component to initialize
    const retryTimeout = setTimeout(retryFailedEvents, 2000);

    return () => clearTimeout(retryTimeout);
  }, []);

  // Check on mount if we're returning from a completed payment
  useEffect(() => {
    const checkPaymentCompletion = async () => {
      const paymentCompleteFlag = localStorage.getItem(
        "checkoutPaymentComplete",
      );
      const orderData = localStorage.getItem("checkoutOrderData");

      if (
        paymentCompleteFlag === "true" &&
        orderData &&
        !hasRecordedCompletion
      ) {
        try {
          const parsedOrderData = JSON.parse(orderData);

          // Track completion events
          await trackCheckoutEvent("booking_submitted", parsedOrderData);
          await trackConversionEvent("booking_completed", {
            completed: true,
            value: parsedOrderData.totalAmount,
            product: parsedOrderData.bouncerName || "Bounce House",
          });

          // Mark as recorded and clean up
          setHasRecordedCompletion(true);
          localStorage.removeItem("checkoutPaymentComplete");
          localStorage.removeItem("checkoutOrderData");
          localStorage.removeItem("checkoutPaymentInProgress");
        } catch (error) {
          console.error("Error processing returning payment:", error);
        }
      }
    };

    checkPaymentCompletion();
  }, []);

  // Track form abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only track abandonment if payment is not in progress or complete
      if (
        (currentStep !== "payment" || !formData.paymentComplete) &&
        localStorage.getItem("checkoutPaymentInProgress") !== "true" &&
        localStorage.getItem("checkoutPaymentComplete") !== "true"
      ) {
        trackCheckoutEvent("booking_abandoned", {
          step: currentStep,
          step_label: getStepLabel(currentStep),
          formData: sanitizeFormData(formData),
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Set form as active when component mounts
    formActiveRef.current = true;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // If component unmounts and form is still active, consider it abandoned
      // But only if we're not in the middle of a payment process
      if (
        formActiveRef.current &&
        currentStep !== "payment" &&
        !formData.paymentComplete &&
        localStorage.getItem("checkoutPaymentInProgress") !== "true" &&
        localStorage.getItem("checkoutPaymentComplete") !== "true"
      ) {
        trackCheckoutEvent("booking_abandoned", {
          step: currentStep,
          step_label: getStepLabel(currentStep),
          formData: sanitizeFormData(formData),
        });
      }
    };
  }, [currentStep, formData]);

  // Track step changes
  useEffect(() => {
    // Skip on initial render
    if (prevStepRef.current !== null) {
      // Calculate time spent on previous step
      const timeSpent = Date.now() - stepStartTimeRef.current;

      // Track completion of previous step
      trackCheckoutEvent("form_step_complete", {
        step: prevStepRef.current,
        step_label: getStepLabel(prevStepRef.current),
        timeSpent,
      });
    }

    // Track view of current step
    trackCheckoutEvent("view_form_step", {
      step: currentStep,
      step_label: getStepLabel(currentStep),
    });

    // Update refs for next change
    prevStepRef.current = currentStep;
    stepStartTimeRef.current = Date.now();

    // Also track in Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "checkout_step_view", {
        step: currentStep,
        step_label: getStepLabel(currentStep),
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`Checkout step: ${currentStep}`, {
        formData: JSON.stringify(formData),
      });
    }
  }, [currentStep]);

  // Track form errors
  useEffect(() => {
    if (Object.keys(formData.errors).length > 0) {
      trackCheckoutEvent("form_step_error", {
        step: currentStep,
        step_label: getStepLabel(currentStep),
        errors: formData.errors,
      });
    }
  }, [formData.errors, currentStep]);

  // Track form completion
  useEffect(() => {
    if (
      currentStep === "payment" &&
      formData.paymentComplete &&
      !hasRecordedCompletion
    ) {
      // Mark form as inactive since it's completed
      formActiveRef.current = false;

      // Store completion data in localStorage in case we navigate away
      const orderData = {
        orderId: formData.orderId,
        orderNumber: formData.orderNumber,
        totalAmount: formData.totalAmount,
        paymentMethod: formData.paymentMethod,
        bouncerName: formData.bouncerName,
      };

      localStorage.setItem("checkoutPaymentComplete", "true");
      localStorage.setItem("checkoutOrderData", JSON.stringify(orderData));
      localStorage.removeItem("checkoutPaymentInProgress");

      // Mark that we've recorded this completion
      setHasRecordedCompletion(true);

      trackCheckoutEvent("booking_submitted", orderData);

      // Track conversion event
      trackConversionEvent("booking_completed", {
        completed: true,
        value: formData.totalAmount,
        product: formData.bouncerName,
      });

      // Also track in Google Analytics
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: formData.orderId,
          value: formData.totalAmount,
          currency: "USD",
          items: [
            ...(formData.selectedBouncer
              ? [
                  {
                    item_id: formData.selectedBouncer,
                    item_name: formData.bouncerName,
                    price: formData.bouncerPrice,
                  },
                ]
              : []),
            ...formData.extras
              .filter((extra) => extra.selected)
              .map((extra) => ({
                item_id: extra.id,
                item_name: extra.name,
                price: extra.price,
              })),
          ],
        });
      }
    }
  }, [currentStep, formData.paymentComplete, formData, hasRecordedCompletion]);

  // Helper function to track checkout events with retry logic
  const trackCheckoutEvent = async (
    type: string,
    data: any,
    retryCount = 0,
  ) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      // Get visitorId from localStorage (set by Fingerprint.tsx)
      const visitorId = localStorage.getItem("visitorId");

      if (!visitorId) {
        console.error("No visitorId found in localStorage");
        // Store failed event for later retry
        storeFailedTrackingEvent("checkout", { type, data });
        return;
      }

      // Validate and sanitize data to prevent oversized payloads
      const sanitizedData = sanitizeTrackingData(data);

      // Create request payload
      const payload = {
        visitorId,
        currentPage: window.location.pathname,
        interaction: {
          type,
          element: "checkout-form",
          page: window.location.pathname,
          data: sanitizedData,
        },
      };

      // Validate payload size (limit to 100KB)
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      if (payloadSize > 100 * 1024) {
        console.warn("Tracking payload too large, truncating data");
        payload.interaction.data = { type, truncated: true };
      }

      // Send event to visitor API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/v1/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response to ensure it's valid JSON
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "API returned unsuccessful response");
      }

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Tracked checkout event: ${type}`, sanitizedData);
      }

      // Clear any stored failed events on successful tracking
      clearStoredFailedEvents();
    } catch (error) {
      console.error(
        `Error tracking checkout event (attempt ${retryCount + 1}):`,
        error,
      );

      // Determine if error is retryable
      const isRetryable = isRetryableError(error);

      if (isRetryable && retryCount < maxRetries) {
        console.log(`Retrying checkout event tracking in ${retryDelay}ms...`);
        setTimeout(() => {
          trackCheckoutEvent(type, data, retryCount + 1);
        }, retryDelay);
      } else {
        // Store failed event for later retry
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        storeFailedTrackingEvent("checkout", {
          type,
          data,
          error: errorMessage,
        });

        // Try fallback tracking method
        tryFallbackTracking(type, data);
      }
    }
  };

  // Helper function to sanitize tracking data
  const sanitizeTrackingData = (data: any) => {
    if (!data || typeof data !== "object") return data;

    // Create a deep copy and remove sensitive fields
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove or truncate large fields
    if (sanitized.formData) {
      delete sanitized.formData.customerEmail;
      delete sanitized.formData.customerPhone;
      delete sanitized.formData.customerAddress;
      delete sanitized.formData.paymentDetails;
    }

    // Truncate long strings
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "string" && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + "...";
      }
    });

    return sanitized;
  };

  // Helper function to determine if an error is retryable
  const isRetryableError = (error: unknown): boolean => {
    if (!error) return false;

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Network errors that are typically retryable
    const retryableErrors = [
      "Failed to fetch",
      "NetworkError",
      "TimeoutError",
      "AbortError",
      "fetch aborted",
      "network timeout",
      "connection refused",
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
    ];

    // HTTP status codes that are retryable
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    // Check for retryable error messages
    const isRetryableMessage = retryableErrors.some((retryableError) =>
      errorMessage.toLowerCase().includes(retryableError.toLowerCase()),
    );

    // Check for retryable HTTP status codes
    const statusMatch = errorMessage.match(/HTTP (\d+):/);
    const isRetryableStatus =
      statusMatch && retryableStatuses.includes(parseInt(statusMatch[1]));

    return isRetryableMessage || isRetryableStatus || false;
  };

  // Helper function to store failed tracking events
  const storeFailedTrackingEvent = (category: string, eventData: any) => {
    try {
      const key = `failedTracking_${category}`;
      const existing = localStorage.getItem(key);
      const events = existing ? JSON.parse(existing) : [];

      events.push({
        ...eventData,
        timestamp: Date.now(),
        retryCount: 0,
      });

      // Keep only last 50 failed events to prevent localStorage bloat
      if (events.length > 50) {
        events.splice(0, events.length - 50);
      }

      localStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      console.error("Failed to store tracking event:", error);
    }
  };

  // Helper function to clear stored failed events
  const clearStoredFailedEvents = () => {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("failedTracking_"),
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Failed to clear stored events:", error);
    }
  };

  // Helper function for fallback tracking
  const tryFallbackTracking = (type: string, data: any) => {
    try {
      // Try using navigator.sendBeacon as fallback
      if (navigator.sendBeacon) {
        const payload = JSON.stringify({
          type: "fallback_tracking",
          originalType: type,
          data: sanitizeTrackingData(data),
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });

        // Send to a simple logging endpoint or external service
        navigator.sendBeacon("/api/v1/visitors", payload);
      }

      // Also try Google Analytics as fallback if available
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "tracking_fallback", {
          event_category: "checkout",
          event_label: type,
          custom_parameter: JSON.stringify(sanitizeTrackingData(data)),
        });
      }
    } catch (error) {
      console.error("Fallback tracking failed:", error);
    }
  };

  // Helper function to track conversion events with retry logic
  const trackConversionEvent = async (
    type: string,
    data: any,
    retryCount = 0,
  ) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      // Get visitorId from localStorage (set by Fingerprint.tsx)
      const visitorId = localStorage.getItem("visitorId");

      if (!visitorId) {
        console.error("No visitorId found in localStorage");
        // Store failed event for later retry
        storeFailedTrackingEvent("conversion", { type, data });
        return;
      }

      // Validate and sanitize data to prevent oversized payloads
      const sanitizedData = sanitizeTrackingData(data);

      // Create request payload
      const payload = {
        visitorId,
        currentPage: window.location.pathname,
        conversionEvent: {
          type,
          ...sanitizedData,
          timestamp: new Date(),
        },
      };

      // Validate payload size (limit to 100KB)
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      if (payloadSize > 100 * 1024) {
        console.warn("Conversion tracking payload too large, truncating data");
        payload.conversionEvent = {
          type,
          truncated: true,
          timestamp: new Date(),
        };
      }

      // Send conversion event to visitor API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/v1/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response to ensure it's valid JSON
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "API returned unsuccessful response");
      }

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Tracked conversion event: ${type}`, sanitizedData);
      }

      // Clear any stored failed events on successful tracking
      clearStoredFailedEvents();
    } catch (error) {
      console.error(
        `Error tracking conversion event (attempt ${retryCount + 1}):`,
        error,
      );

      // Determine if error is retryable
      const isRetryable = isRetryableError(error);

      if (isRetryable && retryCount < maxRetries) {
        console.log(`Retrying conversion event tracking in ${retryDelay}ms...`);
        setTimeout(() => {
          trackConversionEvent(type, data, retryCount + 1);
        }, retryDelay);
      } else {
        // Store failed event for later retry
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        storeFailedTrackingEvent("conversion", {
          type,
          data,
          error: errorMessage,
        });

        // Try fallback tracking method
        tryFallbackTracking(`conversion_${type}`, data);
      }
    }
  };

  // Helper function to get step label
  const getStepLabel = (step: OrderStep | null): string => {
    if (!step) return "";

    switch (step) {
      case "selection":
        return "Choose Bounce House";
      case "datetime":
        return "Date & Time";
      case "details":
        return "Your Info";
      case "extras":
        return "Add Extras";
      case "review":
        return "Review Order";
      case "payment":
        return "Payment";
      default:
        return step;
    }
  };

  // Helper function to sanitize form data for tracking
  // Removes sensitive information and reduces payload size
  const sanitizeFormData = (data: CheckoutState) => {
    // Create a simplified version with only necessary fields
    return {
      currentStep: data.currentStep,
      selectedBouncer: data.selectedBouncer,
      bouncerName: data.bouncerName,
      deliveryDate: data.deliveryDate,
      pickupDate: data.pickupDate,
      extras: data.extras.filter((e) => e.selected).map((e) => e.id),
      subtotal: data.subtotal,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      // Exclude sensitive fields like customerEmail, customerPhone, etc.
    };
  };

  // This component doesn't render anything
  return null;
};

export default OrderFormTracker;
