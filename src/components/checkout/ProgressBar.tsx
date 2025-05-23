import React from "react";
import { OrderStep, steps } from "./utils/types";

interface ProgressBarProps {
  currentStep: OrderStep;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  // Find the current step index
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  // Calculate progress percentage
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="mb-8">
      {/* Step labels */}
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={step.id}
              className={`text-xs font-sm ${
                isActive
                  ? "text-primary-purple"
                  : isCompleted
                    ? "text-primary-blue"
                    : "text-gray-400"
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Progress bar container */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress bar fill */}
        <div
          className="h-full bg-primary-purple transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="relative flex justify-between -mt-1">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full ${
                isActive
                  ? "bg-primary-purple ring-2 ring-primary-purple/30"
                  : isCompleted
                    ? "bg-primary-purple"
                    : "bg-gray-300"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
