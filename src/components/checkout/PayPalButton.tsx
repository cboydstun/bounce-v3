"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Define the PayPal window interface
declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);

  // Load the PayPal SDK script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;

    script.onload = () => {
      console.log("PayPal SDK loaded successfully");
      setScriptLoaded(true);
    };

    script.onerror = (error) => {
      console.error("PayPal SDK could not be loaded.", error);
      onError(new Error("PayPal SDK could not be loaded."));
    };

    document.body.appendChild(script);

    return () => {
      // Only remove the script if we added it
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  // Render the PayPal button once the script is loaded
  useEffect(() => {
    if (!scriptLoaded || buttonRendered || disabled) return;

    const paypalButtonContainer = document.getElementById(
      "paypal-button-container",
    );
    if (!paypalButtonContainer) return;

    // Clear any existing buttons
    paypalButtonContainer.innerHTML = "";

    try {
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "pay",
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: "USD",
                  },
                  description: "Bounce House Rental",
                },
              ],
              application_context: {
                shipping_preference: "NO_SHIPPING",
              },
            });
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const details = await actions.order.capture();
              console.log("Payment successful", details);
              onSuccess(details);
            } catch (error) {
              console.error("Error capturing PayPal order:", error);
              onError(error);
            }
          },
          onError: (err: any) => {
            console.error("PayPal Error:", err);
            onError(err);
          },
          onCancel: () => {
            console.log("Payment cancelled");
          },
        })
        .render("#paypal-button-container")
        .then(() => {
          setButtonRendered(true);
        })
        .catch((error: any) => {
          console.error("Error rendering PayPal buttons:", error);
          onError(error);
        });
    } catch (error) {
      console.error("Error setting up PayPal buttons:", error);
      onError(error);
    }
  }, [scriptLoaded, amount, onSuccess, onError, buttonRendered, disabled]);

  // If the amount changes, we need to re-render the button
  useEffect(() => {
    if (buttonRendered) {
      setButtonRendered(false);
    }
  }, [amount]);

  return (
    <div className="w-full my-4">
      {disabled ? (
        <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
          PayPal payment is disabled until order details are confirmed.
        </div>
      ) : !scriptLoaded ? (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner className="w-8 h-8" />
          <span className="ml-2">Loading PayPal...</span>
        </div>
      ) : (
        <div id="paypal-button-container" className="min-h-[150px]" />
      )}
    </div>
  );
};

export default PayPalButton;
