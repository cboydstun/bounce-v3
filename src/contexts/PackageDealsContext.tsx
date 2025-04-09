"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  isPackageDealsVisible,
  setPackageDealsVisible as setCookie,
} from "../utils/cookieUtils";

// Define the context shape
type PackageDealsContextType = {
  isVisible: boolean;
  setVisible: () => void;
};

// Create the context with default values
const PackageDealsContext = createContext<PackageDealsContextType>({
  isVisible: false,
  setVisible: () => {},
});

// Provider component
export function PackageDealsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  // Check cookie on initial client-side render
  useEffect(() => {
    setIsVisible(isPackageDealsVisible());
  }, []);

  // Function to set visibility
  const setVisible = () => {
    setCookie();
    setIsVisible(true);
  };

  return (
    <PackageDealsContext.Provider value={{ isVisible, setVisible }}>
      {children}
    </PackageDealsContext.Provider>
  );
}

// Custom hook for using the context
export function usePackageDeals() {
  return useContext(PackageDealsContext);
}
