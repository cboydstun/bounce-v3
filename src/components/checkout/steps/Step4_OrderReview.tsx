"use client";

import { useEffect } from "react";
import { CheckoutState } from "../utils/checkoutReducer";
import { calculatePrices } from "../utils/priceCalculation";

interface Step4Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
  onEditStep: (step: number) => void;
}

const Step4_OrderReview: React.FC<Step4Props> = ({
  state,
  dispatch,
  onEditStep = (step) => dispatch({ type: "GO_TO_STEP", payload: step }),
}) => {
  // Recalculate prices when component mounts
  useEffect(() => {
    const prices = calculatePrices(state);
    dispatch({ type: "UPDATE_PRICES", payload: prices });
  }, [state.extras, state.bouncerPrice, dispatch]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Get selected extras
  const selectedExtras = state.extras.filter((extra) => extra.selected);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Review Your Order
      </h2>

      <p className="text-gray-600">
        Please review your order details before proceeding to payment.
      </p>

      {/* Rental Details */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              Rental Details
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-primary-purple hover:text-primary-purple/80 text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Bouncer:</span>
            <span className="font-medium">{state.bouncerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Date:</span>
            <span className="font-medium">
              {formatDate(state.deliveryDate)} at{" "}
              {formatTime(state.deliveryTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pickup Date:</span>
            <span className="font-medium">
              {formatDate(state.pickupDate)} at {formatTime(state.pickupTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              Delivery Information
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-primary-purple hover:text-primary-purple/80 text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{state.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{state.customerEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{state.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Address:</span>
            <span className="font-medium">
              {state.customerAddress}, {state.customerCity},{" "}
              {state.customerState} {state.customerZipCode}
            </span>
          </div>
          {state.deliveryInstructions && (
            <div className="flex justify-between">
              <span className="text-gray-600">Instructions:</span>
              <span className="font-medium">{state.deliveryInstructions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Extras */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              Selected Extras
            </h3>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-primary-purple hover:text-primary-purple/80 text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="p-4">
          {selectedExtras.length > 0 ? (
            <div className="space-y-3">
              {selectedExtras.map((extra) => (
                <div key={extra.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {extra.image} {extra.name}
                  </span>
                  <span className="font-medium">${extra.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No extras selected</p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Order Summary</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Bouncer:</span>
            <span className="font-medium">
              ${state.bouncerPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Extras:</span>
            <span className="font-medium">
              ${(state.subtotal - state.bouncerPrice).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${state.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (8.25%):</span>
            <span className="font-medium">${state.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-medium">${state.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Fee (3%):</span>
            <span className="font-medium">
              ${state.processingFee.toFixed(2)}
            </span>
          </div>
          {state.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-${state.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 my-2"></div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>${state.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Payment Method</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              className="w-6 h-6 text-blue-600"
              fill="currentColor"
            >
              <path d="M186.3 258.2c0 12.2-9.7 21.5-22 21.5-9.2 0-16-5.2-16-15 0-12.2 9.5-22 21.7-22 9.3 0 16.3 5.7 16.3 15.5zM80.5 209.7h-4.7c-1.5 0-3 1-3.2 2.7l-4.3 26.7 8.2-.3c11 0 19.5-1.5 21.5-14.2 2.3-13.4-6.2-14.9-17.5-14.9zm284 0H360c-1.8 0-3 1-3.2 2.7l-4.2 26.7 8-.3c13 0 22-3 22-18-.1-10.6-9.6-11.1-18.1-11.1zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM128.3 215.4c0-21-16.2-28-34.7-28h-40c-2.5 0-5 2-5.2 4.7L32 294.2c-.3 2 1.2 4 3.2 4h19c2.7 0 5.2-2.9 5.5-5.7l4.5-26.6c1-7.2 13.2-4.7 18-4.7 28.6 0 46.1-17 46.1-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.2 8.2-5.8-8.5-14.2-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9 0 20.2-4.9 26.5-11.9-.5 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H200c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm40.5 97.9l63.7-92.6c.5-.5.5-1 .5-1.7 0-1.7-1.5-3.5-3.2-3.5h-19.2c-1.7 0-3.5 1-4.5 2.5l-26.5 39-11-37.5c-.8-2.2-3-4-5.5-4h-18.7c-1.7 0-3.2 1.8-3.2 3.5 0 1.2 19.5 56.8 21.2 62.1-2.7 3.8-20.5 28.6-20.5 31.6 0 1.8 1.5 3.2 3.2 3.2h19.2c1.8-.1 3.5-1.1 4.5-2.6zm159.3-106.7c0-21-16.2-28-34.7-28h-39.7c-2.7 0-5.2 2-5.5 4.7l-16.2 102c-.2 2 1.3 4 3.2 4h20.5c2 0 3.5-1.5 4-3.2l4.5-29c1-7.2 13.2-4.7 18-4.7 28.4 0 45.9-17 45.9-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.3 8.2-5.5-8.5-14-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9.3 0 20.5-4.9 26.5-11.9-.3 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H484c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm47.5-33.3c0-2-1.5-3.5-3.2-3.5h-18.5c-1.5 0-3 1.2-3.2 2.7l-16.2 104-.3.5c0 1.8 1.5 3.5 3.5 3.5h16.5c2.5 0 5-2.9 5.2-5.7L544 191.2v-.3zm-90 51.8c-12.2 0-21.7 9.7-21.7 22 0 9.7 7 15 16.2 15 12 0 21.7-9.2 21.7-21.5.1-9.8-6.9-15.5-16.2-15.5z" />
            </svg>
            <span className="font-medium">PayPal</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            You will be redirected to PayPal to complete your payment securely.
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-blue-800 text-sm">
          By proceeding to payment, you agree to our{" "}
          <a href="/tos" target="_blank" className="underline font-medium">
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy-policy"
            target="_blank"
            className="underline font-medium"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Step4_OrderReview;
