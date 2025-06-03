/**
 * useToast Hook
 *
 * Simple hook for displaying toast notifications using Ionic's IonToast component.
 * Provides a consistent interface for showing success, error, warning, and info messages.
 */

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastState {
  isOpen: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

export interface UseToastReturn {
  toastState: ToastState;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

/**
 * useToast Hook
 *
 * Provides toast notification functionality with consistent styling and behavior.
 *
 * @returns UseToastReturn - Hook return object with toast state and actions
 */
export const useToast = (): UseToastReturn => {
  const [toastState, setToastState] = useState<ToastState>({
    isOpen: false,
    message: "",
    type: "info",
    duration: 3000,
  });

  /**
   * Show a toast notification
   *
   * @param message - Message to display
   * @param type - Type of toast (success, error, warning, info)
   * @param duration - Duration in milliseconds (default: 3000)
   */
  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      setToastState({
        isOpen: true,
        message,
        type,
        duration,
      });
    },
    [],
  );

  /**
   * Hide the current toast
   */
  const hideToast = useCallback(() => {
    setToastState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    toastState,
    showToast,
    hideToast,
  };
};

/**
 * Get Ionic color for toast type
 *
 * @param type - Toast type
 * @returns Ionic color string
 */
export const getToastColor = (type: ToastType): string => {
  switch (type) {
    case "success":
      return "success";
    case "error":
      return "danger";
    case "warning":
      return "warning";
    case "info":
    default:
      return "primary";
  }
};

/**
 * Get toast icon for type
 *
 * @param type - Toast type
 * @returns Icon name string
 */
export const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case "success":
      return "checkmark-circle";
    case "error":
      return "close-circle";
    case "warning":
      return "warning";
    case "info":
    default:
      return "information-circle";
  }
};
