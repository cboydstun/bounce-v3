"use client";

import { useReducer, useEffect, Suspense, useRef } from "react";
import dynamic from "next/dynamic";
import { checkoutReducer, initialState } from "./utils/checkoutReducer";
import { validateStep } from "./utils/validation";
import { calculatePrices } from "./utils/priceCalculation";
import {
  OrderStep,
  Step1Props,
  Step2Props,
  Step3Props,
  Step4Props,
  Step5Props,
} from "./utils/types";
import { ProgressBar } from "./ProgressBar";
import { NavigationButtons } from "./NavigationButtons";
import OrderFormTracker from "./OrderFormTracker";
import StepSkeleton from "./StepSkeleton";

// Dynamically import step components with proper typing
const Step1_RentalSelection = dynamic<Step1Props>(
  () =>
    import("./steps/Step1_RentalSelection").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const Step2_DeliveryInfo = dynamic<Step2Props>(
  () => import("./steps/Step2_DeliveryInfo").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const Step3_Extras = dynamic<Step3Props>(
  () => import("./steps/Step3_Extras").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const Step4_OrderReview = dynamic<Step4Props>(
  () => import("./steps/Step4_OrderReview").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const Step5_Payment = dynamic<Step5Props>(
  () => import("./steps/Step5_Payment").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const CheckoutWizard: React.FC = () => {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const dateAvailabilityErrorRef = useRef<string | null>(null);

  // Update prices whenever relevant state changes
  useEffect(() => {
    if (
      state.selectedBouncers.length > 0 ||
      state.bouncerPrice ||
      state.extras.some((extra) => extra.selected)
    ) {
      const prices = calculatePrices(state);
      dispatch({ type: "UPDATE_PRICES", payload: prices });
    }
  }, [state.selectedBouncers, state.bouncerPrice, state.extras]);

  // Function to create order for cash payments
  const createCashOrder = async () => {
    // Set loading state
    dispatch({ type: "SET_LOADING", payload: true });

    // Track booking started conversion event
    trackConversionEvent("booking_started", {
      completed: false,
      value: state.totalAmount,
      product: state.bouncerName,
    });

    try {
      // Prepare order data
      const orderData = {
        // Customer information
        contactId: state.contactId,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        customerPhone: state.customerPhone,
        customerAddress: state.customerAddress,
        customerCity: state.customerCity,
        customerState: state.customerState,
        customerZipCode: state.customerZipCode,

        // Delivery preferences
        deliveryTimePreference: state.deliveryTimePreference,
        pickupTimePreference: state.pickupTimePreference,
        specificTimeCharge: state.specificTimeCharge,

        // Order items
        items: [
          // Include all selected bouncers (each with quantity 1)
          ...(state.selectedBouncers.length > 0
            ? state.selectedBouncers.map((bouncer) => ({
                type: "bouncer",
                name: bouncer.name,
                quantity: 1, // Fixed at 1
                unitPrice: bouncer.price,
                totalPrice: bouncer.discountedPrice || bouncer.price, // No need to multiply by quantity
              }))
            : // Fallback to legacy single bouncer if no bouncers in the array
              state.selectedBouncer
              ? [
                  {
                    type: "bouncer",
                    name: state.bouncerName,
                    quantity: 1,
                    unitPrice: state.bouncerPrice,
                    totalPrice: state.bouncerPrice,
                  },
                ]
              : []),
          // Include selected extras
          ...state.extras
            .filter((extra) => extra.selected)
            .map((extra) => ({
              type: "extra",
              name: extra.name,
              quantity: extra.id === "tablesChairs" ? extra.quantity : 1,
              unitPrice: extra.price,
              totalPrice:
                extra.price *
                (extra.id === "tablesChairs" ? extra.quantity : 1),
            })),
        ],

        // Financial details
        subtotal: state.subtotal,
        taxAmount: state.taxAmount,
        discountAmount: state.discountAmount,
        deliveryFee: state.deliveryFee,
        processingFee: state.processingFee,
        totalAmount: state.totalAmount,
        depositAmount: state.depositAmount,
        balanceDue: state.balanceDue,

        // Status information
        status: "Pending",
        paymentStatus: "Pending",
        paymentMethod: "cash",

        // Additional information
        tasks: state.tasks,
        notes: `Delivery: ${state.deliveryDate} ${state.deliveryTime}, Pickup: ${state.pickupDate} ${state.pickupTime}${
          state.deliveryInstructions
            ? `, Instructions: ${state.deliveryInstructions}`
            : ""
        }`,
      };

      // Create order
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create order. Please try again.",
        );
      }

      const order = await response.json();

      // Store order ID and number in state
      dispatch({ type: "SET_ORDER_ID", payload: order._id });
      dispatch({ type: "SET_ORDER_NUMBER", payload: order.orderNumber });

      // Track booking completed conversion event
      trackConversionEvent("booking_completed", {
        completed: true,
        value: state.totalAmount,
        product: state.bouncerName,
      });

      // Mark as complete (but with different status than PayPal)
      dispatch({ type: "CASH_ORDER_SUCCESS" });

      // Go to confirmation step
      dispatch({ type: "GO_TO_STEP", payload: "payment" });
    } catch (error) {
      console.error("Error creating cash order:", error);
      dispatch({
        type: "ORDER_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to create order. Please try again.",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Handle going to the next step
  const goToNextStep = () => {
    // Validate current step
    const errors = validateStep(state.currentStep, state);

    // Check for availability error first
    if (state.currentStep === "delivery" && dateAvailabilityErrorRef.current) {
      dispatch({
        type: "SET_ERRORS",
        payload: { deliveryDate: dateAvailabilityErrorRef.current },
      });
      return;
    }

    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_ERRORS", payload: errors });
      return;
    }

    // Special handling for review step with cash payment
    if (state.currentStep === "review" && state.paymentMethod === "cash") {
      // Create order directly without going to payment step
      createCashOrder();
      return;
    }

    dispatch({ type: "NEXT_STEP" });
  };

  // Handle going to the previous step
  const goToPreviousStep = () => {
    dispatch({ type: "PREVIOUS_STEP" });
  };

  // Handle going to a specific step (for edit buttons)
  const goToStep = (step: OrderStep) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  };

  // Handle payment success
  const handlePaymentSuccess = (details: any) => {
    // Track booking completed conversion event
    trackConversionEvent("booking_completed", {
      completed: true,
      value: state.totalAmount,
      product: state.bouncerName,
    });

    dispatch({ type: "PAYMENT_SUCCESS" });
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

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case "delivery":
        return <Step1_RentalSelection state={state} dispatch={dispatch} />;
      case "details":
        return <Step2_DeliveryInfo state={state} dispatch={dispatch} />;
      case "extras":
        return <Step3_Extras state={state} dispatch={dispatch} />;
      case "review":
        return (
          <Step4_OrderReview
            state={state}
            dispatch={dispatch}
            onEditStep={goToStep}
          />
        );
      case "payment":
        return (
          <Step5_Payment
            state={state}
            dispatch={dispatch}
            onPaymentSuccess={handlePaymentSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Track form step changes */}
      <OrderFormTracker currentStep={state.currentStep} formData={state} />

      {/* Progress Bar */}
      <ProgressBar currentStep={state.currentStep} />

      {/* Step Content */}
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl p-8 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-purple/10 dark:bg-primary-purple/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl" />

        {/* Form Steps with Suspense boundary */}
        <Suspense fallback={<StepSkeleton />}>{renderStepContent()}</Suspense>

        {/* Navigation Buttons */}
        {(state.currentStep !== "payment" || state.paymentError) && (
          <NavigationButtons
            currentStep={state.currentStep}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            isNextDisabled={
              // Disable next button if there are validation errors
              Object.keys(state.errors).length > 0 ||
              // Or if we're on extras step and no items are selected
              (state.currentStep === "extras" &&
                state.selectedBouncers.length === 0 &&
                !state.selectedBouncer &&
                !state.extras.some((extra) => extra.selected)) ||
              // Or if we're on review step and terms not agreed
              (state.currentStep === "review" && !state.agreedToTerms)
            }
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutWizard;
