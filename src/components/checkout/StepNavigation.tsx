import React from "react";

interface StepNavigationProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  isNextDisabled?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onNext,
  onPrevious,
  isLastStep,
  isFirstStep,
  nextButtonText,
  backButtonText,
  isNextDisabled = false,
}) => {
  // Determine button text based on current step
  const getNextButtonText = () => {
    if (nextButtonText) return nextButtonText;

    if (isLastStep) return "Complete Order";
    if (currentStep === 4) return "Proceed to Payment";
    return "Continue";
  };

  const getBackButtonText = () => {
    if (backButtonText) return backButtonText;
    return "Back";
  };

  return (
    <div className="flex justify-between mt-8">
      {/* Back button */}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
        >
          {getBackButtonText()}
        </button>
      )}

      {/* Spacer if first step */}
      {isFirstStep && <div></div>}

      {/* Next button - hidden on the last step (payment) as PayPal button will be used */}
      {!isLastStep && (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple ${
            isNextDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary-purple hover:bg-primary-purple/90"
          }`}
        >
          {getNextButtonText()}
        </button>
      )}
    </div>
  );
};

export default StepNavigation;
