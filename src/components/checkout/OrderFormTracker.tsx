"use client";

import { useEffect } from "react";
import { OrderStep, CheckoutState } from "./utils/types";

interface OrderFormTrackerProps {
  currentStep: OrderStep;
  formData: CheckoutState;
}

/**
 * Component to track user progress through the checkout form
 * This is a client-side only component that doesn't render anything
 */
const OrderFormTracker: React.FC<OrderFormTrackerProps> = ({
  currentStep,
  formData,
}) => {
  // Track step changes
  useEffect(() => {
    try {
      // Track step view
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
    } catch (error) {
      // Silently fail to avoid breaking the checkout flow
      console.error("Error tracking checkout step:", error);
    }
  }, [currentStep]);

  // Track form completion
  useEffect(() => {
    if (currentStep === "payment" && formData.paymentComplete) {
      try {
        // Track successful payment
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "purchase", {
            transaction_id: formData.orderId,
            value: formData.totalAmount,
            currency: "USD",
            items: [
              {
                item_id: formData.selectedBouncer,
                item_name: formData.bouncerName,
                price: formData.bouncerPrice,
              },
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
      } catch (error) {
        // Silently fail to avoid breaking the checkout flow
        console.error("Error tracking purchase:", error);
      }
    }
  }, [currentStep, formData.paymentComplete]);

  // Helper function to get step label
  const getStepLabel = (step: OrderStep): string => {
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

  // This component doesn't render anything
  return null;
};

export default OrderFormTracker;
