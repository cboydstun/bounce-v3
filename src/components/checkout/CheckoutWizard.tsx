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
} from "./utils/types";
import { ProgressBar } from "./ProgressBar";
import { NavigationButtons } from "./NavigationButtons";
import OrderFormTracker from "./OrderFormTracker";
import StepSkeleton from "./StepSkeleton";
import { postWithRetry } from "@/utils/apiClient";

// Dynamically import step components with proper typing
const Step1_BouncerSelection = dynamic<Step1Props>(
  () =>
    import("./steps/Step1_BouncerSelection").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const Step2_DeliveryDateTime = dynamic<Step2Props>(
  () =>
    import("./steps/Step2_DeliveryDateTime").then((mod) => mod.default as any),
  {
    loading: () => <StepSkeleton />,
    ssr: false,
  },
);

const Step3_DeliveryInfo = dynamic<Step2Props>(
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

  // Clean up localStorage when component unmounts if payment is complete
  useEffect(() => {
    return () => {
      // Only clean up if payment is complete to avoid clearing data needed for tracking
      if (state.paymentComplete) {
        console.log("Cleaning up localStorage data after successful payment");
        // We don't want to remove these as they're needed for tracking in OrderFormTracker
        // localStorage.removeItem('checkoutPaymentComplete');
        // localStorage.removeItem('checkoutOrderData');
      }
    };
  }, [state.paymentComplete]);

  // Function to create order for cash payments
  const createCashOrder = async () => {
    // Pre-validation check to ensure we have items
    const hasBouncers =
      state.selectedBouncers.length > 0 ||
      (state.selectedBouncer && state.bouncerName);
    const hasExtras = state.extras.some((extra) => extra.selected);
    const hasMixers = state.slushyMixers.some(
      (mixer) => mixer.mixerId !== "none",
    );

    if (!hasBouncers && !hasExtras && !hasMixers) {
      dispatch({
        type: "ORDER_ERROR",
        payload:
          "Please select at least one item before proceeding with your order.",
      });
      return;
    }

    // Set loading state
    dispatch({ type: "SET_LOADING", payload: true });

    // Mark payment as in progress
    localStorage.setItem("checkoutPaymentInProgress", "true");

    // Track booking started conversion event
    trackConversionEvent("booking_started", {
      completed: false,
      value: state.totalAmount,
      product: state.bouncerName,
    });

    try {
      // Build items array with proper validation
      const orderItems = [];

      // Add bouncers
      if (state.selectedBouncers.length > 0) {
        // Use new multi-bouncer selection
        orderItems.push(
          ...state.selectedBouncers.map((bouncer) => ({
            type: "bouncer",
            name: bouncer.name,
            quantity: 1,
            unitPrice: bouncer.price,
            totalPrice: bouncer.discountedPrice || bouncer.price,
          })),
        );
      } else if (state.selectedBouncer && state.bouncerName) {
        // Fallback to legacy single bouncer
        orderItems.push({
          type: "bouncer",
          name: state.bouncerName,
          quantity: 1,
          unitPrice: state.bouncerPrice || 0,
          totalPrice: state.bouncerPrice || 0,
        });
      }

      // Add selected extras
      const selectedExtras = state.extras
        .filter((extra) => extra.selected)
        .map((extra) => ({
          type: "extra",
          name: extra.name,
          quantity: extra.id === "tablesChairs" ? extra.quantity : 1,
          unitPrice: extra.price,
          totalPrice:
            extra.price * (extra.id === "tablesChairs" ? extra.quantity : 1),
        }));
      orderItems.push(...selectedExtras);

      // Add selected mixers
      const selectedMixers = state.slushyMixers
        .filter((mixer) => mixer.mixerId !== "none")
        .map((mixer) => ({
          type: "extra",
          name: `Mixer (Tank ${mixer.tankNumber}): ${mixer.name}`,
          quantity: 1,
          unitPrice: mixer.price,
          totalPrice: mixer.price,
        }));
      orderItems.push(...selectedMixers);

      // Final validation - ensure we have items
      if (orderItems.length === 0) {
        throw new Error(
          "No items selected for order. Please select at least one bouncer or extra.",
        );
      }

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

        // Order items - now properly validated
        items: orderItems,

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

      // Create order using enhanced API client with retry logic
      const result = await postWithRetry("/api/v1/orders", orderData, {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 8000,
        timeoutMs: 30000,
      });

      if (!result.success) {
        throw new Error(
          result.error || "Failed to create order. Please try again.",
        );
      }

      const order = result.data;

      // Store order ID and number in state
      dispatch({ type: "SET_ORDER_ID", payload: order._id });
      dispatch({ type: "SET_ORDER_NUMBER", payload: order.orderNumber });

      // Track booking completed conversion event
      trackConversionEvent("booking_completed", {
        completed: true,
        value: state.totalAmount,
        product: state.bouncerName,
      });

      // Store order data for tracking
      const trackingData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: state.totalAmount,
        paymentMethod: "cash",
        bouncerName: state.bouncerName,
      };
      localStorage.setItem("checkoutOrderData", JSON.stringify(trackingData));
      localStorage.setItem("checkoutPaymentComplete", "true");
      localStorage.removeItem("checkoutPaymentInProgress");

      // Mark as complete (but with different status than PayPal)
      dispatch({ type: "CASH_ORDER_SUCCESS" });
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
    if (state.currentStep === "datetime" && dateAvailabilityErrorRef.current) {
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
  const handlePaymentSuccess = () => {
    // Mark payment as complete
    localStorage.setItem("checkoutPaymentComplete", "true");
    localStorage.removeItem("checkoutPaymentInProgress");

    // Store order data for tracking
    const orderData = {
      orderId: state.orderId,
      orderNumber: state.orderNumber,
      totalAmount: state.totalAmount,
      paymentMethod: state.paymentMethod,
      bouncerName: state.bouncerName,
    };
    localStorage.setItem("checkoutOrderData", JSON.stringify(orderData));

    // Track booking completed conversion event
    trackConversionEvent("booking_completed", {
      completed: true,
      value: state.totalAmount,
      product: state.bouncerName,
    });

    dispatch({ type: "PAYMENT_SUCCESS" });
  };

  // Handle payment initiation
  const handlePaymentInitiation = () => {
    // Mark payment as in progress
    localStorage.setItem("checkoutPaymentInProgress", "true");
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
      case "selection":
        return <Step1_BouncerSelection state={state} dispatch={dispatch} />;
      case "datetime":
        return <Step2_DeliveryDateTime state={state} dispatch={dispatch} />;
      case "details":
        return <Step3_DeliveryInfo state={state} dispatch={dispatch} />;
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

        {/* Navigation Buttons - Hide when order is complete */}
        {!(state.currentStep === "review" && state.paymentComplete) && (
          <NavigationButtons
            currentStep={state.currentStep}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            isNextDisabled={
              // Only disable for logical impossibilities, not validation errors
              // If we're on extras step and no items are selected
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
