"use client";

import { useEffect, useRef } from "react";
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

  // Track form abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentStep !== "payment" || !formData.paymentComplete) {
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
      if (formActiveRef.current && currentStep !== "payment") {
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
    if (currentStep === "payment" && formData.paymentComplete) {
      // Mark form as inactive since it's completed
      formActiveRef.current = false;

      trackCheckoutEvent("booking_submitted", {
        orderId: formData.orderId,
        orderNumber: formData.orderNumber,
        totalAmount: formData.totalAmount,
        paymentMethod: formData.paymentMethod,
      });

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
  }, [currentStep, formData.paymentComplete, formData]);

  // Helper function to track checkout events
  const trackCheckoutEvent = async (type: string, data: any) => {
    try {
      // Get visitorId from localStorage (set by Fingerprint.tsx)
      const visitorId = localStorage.getItem("visitorId");

      if (!visitorId) {
        console.error("No visitorId found in localStorage");
        return;
      }

      // Send event to visitor API
      await fetch("/api/v1/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId,
          currentPage: window.location.pathname,
          interaction: {
            type,
            element: "checkout-form",
            page: window.location.pathname,
            data,
          },
        }),
      });

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Tracked checkout event: ${type}`, data);
      }
    } catch (error) {
      // Silently fail to avoid breaking the checkout flow
      console.error("Error tracking checkout event:", error);
    }
  };

  // Helper function to track conversion events
  const trackConversionEvent = async (type: string, data: any) => {
    try {
      // Get visitorId from localStorage (set by Fingerprint.tsx)
      const visitorId = localStorage.getItem("visitorId");

      if (!visitorId) {
        console.error("No visitorId found in localStorage");
        return;
      }

      // Send conversion event to visitor API
      await fetch("/api/v1/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId,
          currentPage: window.location.pathname,
          conversionEvent: {
            type,
            ...data,
            timestamp: new Date(),
          },
        }),
      });

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Tracked conversion event: ${type}`, data);
      }
    } catch (error) {
      // Silently fail to avoid breaking the checkout flow
      console.error("Error tracking conversion event:", error);
    }
  };

  // Helper function to get step label
  const getStepLabel = (step: OrderStep | null): string => {
    if (!step) return "";

    switch (step) {
      case "delivery":
        return "Rental Selection";
      case "details":
        return "Delivery Information";
      case "extras":
        return "Add Extras";
      case "review":
        return "Order Review";
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
