"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  isPackageDealsVisible,
  setPackageDealsVisible as setCookie,
} from "../utils/cookieUtils";

// Define the context shape
type PackageDealsContextType = {
  hasCompletedForm: boolean;
  setFormCompleted: () => void;
};

// Create the context with default values
const PackageDealsContext = createContext<PackageDealsContextType>({
  hasCompletedForm: false,
  setFormCompleted: () => {},
});

// Provider component
export function PackageDealsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasCompletedForm, setHasCompletedForm] = useState(false);

  // Check cookie on initial client-side render
  useEffect(() => {
    setHasCompletedForm(isPackageDealsVisible());
  }, []);

  // Function to set form completion status
  const setFormCompleted = () => {
    setCookie();
    setHasCompletedForm(true);
  };

  return (
    <PackageDealsContext.Provider
      value={{ hasCompletedForm, setFormCompleted }}
    >
      {children}
    </PackageDealsContext.Provider>
  );
}

// Custom hook for using the context
export function usePackageDeals() {
  return useContext(PackageDealsContext);
}
