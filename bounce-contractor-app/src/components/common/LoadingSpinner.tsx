import React from "react";
import { IonSpinner } from "@ionic/react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  fullScreen = false,
  message = "Loading...",
}) => {
  const spinnerSize = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  }[size];

  const containerClass = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50"
    : "flex items-center justify-center h-full min-h-[200px]";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-3">
        <IonSpinner name="crescent" className={`text-primary ${spinnerSize}`} />
        {message && (
          <p className="text-sm text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
