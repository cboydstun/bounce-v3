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
    if (state.bouncerPrice || state.extras.some((extra) => extra.selected)) {
      const prices = calculatePrices(state);
      dispatch({ type: "UPDATE_PRICES", payload: prices });
    }
  }, [state.bouncerPrice, state.extras]);

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
    dispatch({ type: "PAYMENT_SUCCESS" });
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
              // Or if we're on step 1 and no bouncer is selected
              (state.currentStep === "delivery" && !state.selectedBouncer) ||
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
