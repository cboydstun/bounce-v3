import React from "react";
import { OrderStep } from "./utils/types";

interface NavigationButtonsProps {
  currentStep: OrderStep;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  onPrevious,
  onNext,
  isNextDisabled = false,
}) => {
  // Determine button text based on current step
  const getNextButtonText = () => {
    switch (currentStep) {
      case "review":
        return "Complete Order";
      default:
        return "Continue";
    }
  };

  // Always show next button since we removed the payment step
  const showNextButton = true;

  // First step doesn't need a back button
  const showPreviousButton = currentStep !== "selection";

  return (
    <div className="flex justify-between mt-8">
      {/* Back button */}
      {showPreviousButton ? (
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>
      ) : (
        <div></div> // Empty div for spacing
      )}

      {/* Next button */}
      {showNextButton && (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className={`flex items-center px-6 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple transition-colors ${
            isNextDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary-purple hover:bg-primary-purple/90"
          }`}
        >
          {getNextButtonText()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
