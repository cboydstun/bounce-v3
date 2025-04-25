"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { CheckoutState } from "./utils/types";

interface PayPalCheckoutProps {
  amount: number;
  currency: string;
  rentalData: Partial<CheckoutState>;
  onSuccess: (orderId: string) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

export function PayPalCheckout({
  amount,
  currency,
  rentalData,
  onSuccess,
  onError,
  disabled = false,
}: PayPalCheckoutProps) {
  return (
    <div className="w-full my-4">
      {disabled ? (
        <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
          PayPal payment is disabled until order details are confirmed.
        </div>
      ) : (
        <PayPalButtons
          disabled={disabled}
          forceReRender={[amount, currency, disabled]}
          fundingSource="paypal"
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
            height: 45,
          }}
          createOrder={(data, actions) => {
            console.log("[PayPalCheckout] Creating order for amount:", amount.toFixed(2));
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: currency,
                  },
                  description: "Bounce House Rental",
                },
              ],
              application_context: {
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
              },
            });
          }}
          onApprove={async (data, actions) => {
            console.log("[PayPalCheckout] Payment approved:", data);
            try {
              if (!actions.order) {
                throw new Error("PayPal order actions not available");
              }
              
              const orderDetails = await actions.order.capture();
              console.log("[PayPalCheckout] Payment successful:", orderDetails);
              
              // Make sure we have an order ID
              if (!orderDetails.id) {
                throw new Error("Order ID not found in PayPal response");
              }
              
              onSuccess(orderDetails.id);
              
              // Return void to satisfy TypeScript
              return;
            } catch (error) {
              console.error("[PayPalCheckout] Error capturing order:", error);
              onError(error instanceof Error ? error : new Error(String(error)));
              throw error;
            }
          }}
          onError={(err) => {
            console.error("[PayPalCheckout] PayPal Error:", err);
            onError(err instanceof Error ? err : new Error(String(err)));
          }}
          onCancel={() => {
            console.log("[PayPalCheckout] Payment cancelled by user");
          }}
        />
      )}
    </div>
  );
}
