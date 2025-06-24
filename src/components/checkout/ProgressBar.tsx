import React from "react";
import { OrderStep, steps } from "./utils/types";

interface ProgressBarProps {
  currentStep: OrderStep;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  // Find the current step index
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  // Calculate progress percentage to align with step positions
  // This ensures the progress bar aligns with the actual step dots
  const progressPercentage =
    steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="mb-8">
      {/* Step labels */}
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={step.id}
              className={`text-center max-w-[120px] ${
                isActive
                  ? "text-white font-semibold"
                  : isCompleted
                    ? "text-white/90 font-medium"
                    : "text-white/60"
              }`}
            >
              {/* Step number */}
              <div
                className={`text-xs mb-1 ${
                  isActive
                    ? "text-yellow-300"
                    : isCompleted
                      ? "text-green-300"
                      : "text-white/40"
                }`}
              >
                Step {index + 1}
              </div>
              {/* Step label */}
              <div className="text-sm leading-tight">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress bar container with better contrast */}
      <div className="relative">
        {/* Background track */}
        <div className="w-full h-3 bg-white/20 rounded-full shadow-inner">
          {/* Progress bar fill with gradient */}
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step dots positioned to align with progress */}
        <div className="absolute top-0 w-full flex justify-between -mt-1">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentIndex;

            return (
              <div
                key={step.id}
                className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  isActive
                    ? "bg-yellow-400 border-yellow-300 shadow-lg scale-110"
                    : isCompleted
                      ? "bg-green-400 border-green-300 shadow-md"
                      : "bg-white/30 border-white/50"
                }`}
              >
                {/* Checkmark for completed steps */}
                {isCompleted && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {/* Current step indicator */}
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}

                {/* Future step number */}
                {!isActive && !isCompleted && (
                  <span className="text-xs font-medium text-white/70">
                    {index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress text indicator */}
      <div className="mt-4 text-center">
        <span className="text-white/80 text-sm">
          Step {currentIndex + 1} of {steps.length}
        </span>
        <span className="text-white/60 text-xs ml-2">
          ({Math.round(((currentIndex + 1) / steps.length) * 100)}% complete)
        </span>
      </div>
    </div>
  );
};
