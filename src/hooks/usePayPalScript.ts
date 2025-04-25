"use client";

import { useState, useEffect, useRef } from "react";

// Define the PayPal interface
import type { PayPalNamespace as PayPalNamespaceFromSDK } from "@paypal/paypal-js";

interface PayPalNamespace extends PayPalNamespaceFromSDK {}

// Define the PayPal window interface
declare global {
  interface Window {
    // @ts-ignore
    paypal?: PayPalNamespace;
  }
}

interface UsePayPalScriptOptions {
  onError?: (error: Error) => void;
  debug?: boolean;
  currency?: string;
  components?: string[];
}

/**
 * Custom hook to load the PayPal SDK script using the official PayPal recommended approach
 */
export function usePayPalScript({
  onError,
  debug = true,
  currency = "USD",
  components = ["buttons"]
}: UsePayPalScriptOptions = {}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<Error | null>(null);
  const clientIdRef = useRef<string | undefined>(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
  const paypalRef = useRef<PayPalNamespace | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptLoadAttemptedRef = useRef(false);
  
  // Debug logging function
  const log = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[PayPalScript] ${message}`, ...args);
    }
  };

  // Error logging function
  const logError = (message: string, ...args: any[]) => {
    console.error(`[PayPalScript] ${message}`, ...args);
  };

  // Function to clear all timers
  const clearTimers = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Function to handle script loading
  const loadPayPalScript = () => {
    if (scriptLoadAttemptedRef.current) return;
    scriptLoadAttemptedRef.current = true;

    // Validate client ID
    if (!clientIdRef.current) {
      const error = new Error("PayPal Client ID is missing. Check your environment variables.");
      logError(error.message);
      setScriptError(error);
      if (onError) onError(error);
      return;
    }

    log("Initializing PayPal script with client ID:", clientIdRef.current.substring(0, 10) + "...");

    // Check if PayPal is already available globally
    if (window.paypal) {
      log("window.paypal is already available globally");
      paypalRef.current = window.paypal;
      setScriptLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[data-namespace="paypalSDK"]');
    if (existingScript) {
      log("PayPal script tag already exists in DOM");
      
      // Set up a check interval to wait for window.paypal to be available
      checkIntervalRef.current = setInterval(() => {
        if (window.paypal) {
          log("window.paypal is now available");
          clearTimers();
          paypalRef.current = window.paypal;
          setScriptLoaded(true);
        }
      }, 100);
      
      // Set a timeout to stop checking after 15 seconds
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        if (!window.paypal) {
          const timeoutError = new Error("PayPal SDK failed to initialize after timeout");
          logError(timeoutError.message);
          setScriptError(timeoutError);
          if (onError) onError(timeoutError);
        }
      }, 15000);
      
      return;
    }

    try {
      // Build the script URL with all necessary parameters
      const componentsParam = components.join(',');
      const scriptUrl = new URL('https://www.paypal.com/sdk/js');
      scriptUrl.searchParams.append('client-id', clientIdRef.current);
      scriptUrl.searchParams.append('currency', currency);
      scriptUrl.searchParams.append('components', componentsParam);
      scriptUrl.searchParams.append('debug', debug ? 'true' : 'false');
      // Add a cache buster to prevent caching issues
      scriptUrl.searchParams.append('_', Date.now().toString());
      
      log("Creating PayPal script with URL:", scriptUrl.toString());

      // Create the script element using the official PayPal approach
      const script = document.createElement('script');
      script.src = scriptUrl.toString();
      script.setAttribute('data-namespace', 'paypalSDK');
      script.setAttribute('data-page-type', 'checkout');
      script.setAttribute('data-partner-attribution-id', 'NEXTJS_PAYPAL_INTEGRATION');
      script.async = true;
      script.defer = true;
      
      // Add event listeners
      script.addEventListener('load', () => {
        log("PayPal script onload event fired");
        
        // Set up a check interval to wait for window.paypal to be available
        checkIntervalRef.current = setInterval(() => {
          if (window.paypal) {
            log("window.paypal is now available after load event");
            clearTimers();
            paypalRef.current = window.paypal;
            setScriptLoaded(true);
            setScriptError(null);
          }
        }, 100);
        
        // Set a timeout to stop checking after 15 seconds
        timeoutRef.current = setTimeout(() => {
          clearTimers();
          if (!window.paypal) {
            const timeoutError = new Error("PayPal SDK failed to initialize after timeout");
            logError(timeoutError.message);
            setScriptError(timeoutError);
            if (onError) onError(timeoutError);
          }
        }, 15000);
      });
      
      script.addEventListener('error', (event) => {
        logError("PayPal script loading error:", event);
        clearTimers();
        const loadError = new Error("Failed to load PayPal SDK script");
        setScriptError(loadError);
        if (onError) onError(loadError);
      });
      
      // Add the script to the document head (PayPal recommends head over body)
      log("Appending PayPal script to document head");
      document.head.appendChild(script);
      
    } catch (error) {
      logError("Error during PayPal script creation:", error);
      const creationError = error instanceof Error ? error : new Error(String(error));
      setScriptError(creationError);
      if (onError) onError(creationError);
    }
  };

  // Load the script when the component mounts
  useEffect(() => {
    loadPayPalScript();
    
    // Cleanup function
    return () => {
      clearTimers();
    };
  }, []);

  // Additional check for window.paypal in case it becomes available after initial load
  useEffect(() => {
    if (!scriptLoaded && !scriptError && window.paypal) {
      log("window.paypal detected after initial load");
      paypalRef.current = window.paypal;
      setScriptLoaded(true);
    }
  }, [scriptLoaded, scriptError]);

  // Function to manually retry loading the script
  const retryLoading = () => {
    log("Manually retrying script load");
    clearTimers();
    setScriptError(null);
    scriptLoadAttemptedRef.current = false;
    
    // Remove any existing script tags
    const existingScript = document.querySelector('script[data-namespace="paypalSDK"]');
    if (existingScript) {
      log("Removing existing PayPal script tag");
      existingScript.remove();
    }
    
    // Try loading again
    loadPayPalScript();
  };

  return {
    scriptLoaded,
    scriptError,
    paypal: scriptLoaded && !scriptError ? (paypalRef.current || window.paypal) : null,
    clientId: clientIdRef.current,
    retryLoading
  };
}
