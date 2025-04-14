import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  steps?: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  steps = [
    "Rental Selection",
    "Delivery Info",
    "Add Extras",
    "Review Order",
    "Payment",
  ],
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div
              key={stepNumber}
              className="flex flex-col items-center relative"
            >
              {/* Step connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-1 ${
                    isCompleted ? "bg-primary-purple" : "bg-gray-300"
                  }`}
                  style={{ transform: "translateX(50%)" }}
                />
              )}
              
              {/* Step circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  isActive
                    ? "bg-primary-purple text-white"
                    : isCompleted
                    ? "bg-primary-purple text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              
              {/* Step label */}
              <span
                className={`mt-2 text-xs sm:text-sm font-medium ${
                  isActive ? "text-white" : "text-white"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
