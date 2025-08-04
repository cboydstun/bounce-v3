"use client";

import { useEffect } from "react";
import { CheckoutState, OrderStep } from "../utils/types";
import { calculatePrices } from "../utils/priceCalculation";
import { formatDisplayDateCT, parseDateCT } from "@/utils/dateUtils";

// Helper function to calculate days between dates using Central Time utility functions
function calculateRentalDays(deliveryDate: string, pickupDate: string): number {
  if (!deliveryDate || !pickupDate) return 0;

  // Parse dates using Central Time utility function
  const delivery = parseDateCT(deliveryDate);
  const pickup = parseDateCT(pickupDate);

  // Calculate the difference in days
  const diffTime = pickup.getTime() - delivery.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

interface Step4Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
  onEditStep: (step: OrderStep) => void;
}

const Step4_OrderReview: React.FC<Step4Props> = ({
  state,
  dispatch,
  onEditStep = (step) => dispatch({ type: "GO_TO_STEP", payload: step }),
}) => {
  // Recalculate prices when component mounts or when payment method changes
  useEffect(() => {
    // Set payment method to cash by default (since it's the only option now)
    if (state.paymentMethod !== "cash") {
      dispatch({ type: "SET_PAYMENT_METHOD", payload: "cash" });
    }

    const prices = calculatePrices(state);
    dispatch({ type: "UPDATE_PRICES", payload: prices });

    // Update balance due
    dispatch({ type: "UPDATE_BALANCE_DUE" });

    // Reset deposit amount to 0 for cash payments
    if (state.depositAmount > 0) {
      dispatch({ type: "SET_DEPOSIT_AMOUNT", payload: 0 });
    }
  }, [
    state.extras,
    state.bouncerPrice,
    state.depositAmount,
    state.paymentMethod,
    state.selectedBouncers,
    dispatch,
  ]);

  // Format date for display using Central Time utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return formatDisplayDateCT(parseDateCT(dateString));
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

  // Show loading state while creating order
  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Creating Your Order
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple"></div>
          <span className="ml-3 text-lg">Processing your order...</span>
        </div>
      </div>
    );
  }

  // Show success state when order is complete
  if (state.paymentComplete && state.orderNumber) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Reservation Confirmed!
          </h2>
          <p className="text-gray-600 mb-6">
            Your equipment rental reservation has been successfully placed.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Reservation Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{state.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">
                ${state.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reservation Status:</span>
              <span className="font-medium text-green-600">Confirmed</span>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How It Works
          </h3>
          <div className="space-y-3 text-blue-800">
            <p>
              <strong>✓ Your reservation is complete!</strong> We don't get paid
              until we arrive with your equipment rental.
            </p>
            <p>
              <strong>🌤️ Weather dependent:</strong> We are dependent on the
              weather and will have to cancel if it is raining or too windy for
              safety reasons.
            </p>
            <p>
              <strong>📞 Day-before confirmation:</strong> We will follow up the
              day before to confirm the weather is cooperating and the party is
              still on.
            </p>
          </div>
        </div>

        {/* Important Payment Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Important Payment Information
          </h3>
          <div className="space-y-3 text-red-800">
            <p>
              <strong>⚠️ Please do NOT pay the invoice early!</strong>
            </p>
            <p>
              <strong>🚫 We do NOT offer refunds for any reason.</strong>
            </p>
            <p>
              <strong>🌧️ Rain check policy:</strong> If you pay the invoice
              early and sudden inclement weather cancels the party, there will
              be no refund - it will be a "rain check." You will still get your
              party, but only when it is safe.
            </p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-md">
          <p className="text-green-800">
            A confirmation email has been sent to {state.customerEmail}. If you
            have any questions about your reservation, please contact us at{" "}
            <a href="tel:5122100194" className="font-medium underline">
              (512) 210-0194
            </a>
            .
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (state.paymentError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order Failed
          </h2>
          <p className="text-red-600 mb-6">{state.paymentError}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">What to do next?</h3>
          <p className="text-gray-600 mb-4">
            You can try the following options:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Go back and check your order details</li>
            <li>Try again in a few moments</li>
            <li>
              Contact us at{" "}
              <a href="tel:5122100194" className="text-primary-purple">
                (512) 210-0194
              </a>{" "}
              for assistance
            </li>
          </ul>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "PAYMENT_ERROR", payload: "" });
            }}
            className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg font-medium hover:bg-primary-purple/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              onClick={() => onEditStep("datetime")}
              className="text-primary-purple hover:text-primary-purple/80 text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {state.selectedBouncers.length > 0 ? (
            <>
              {/* Sort bouncers by price (highest to lowest) for display */}
              {[...state.selectedBouncers]
                .sort((a, b) => b.price - a.price)
                .map((bouncer, index) => (
                  <div key={bouncer.id} className="flex justify-between">
                    <span className="text-gray-600">
                      {bouncer.name}
                      {index === 0 ? (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium ml-2 px-2 py-0.5 rounded">
                          Full Price
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-xs font-medium ml-2 px-2 py-0.5 rounded">
                          50% Off
                        </span>
                      )}
                    </span>
                    <span className="font-medium">
                      {index === 0 ? (
                        `$${bouncer.price.toFixed(2)}`
                      ) : (
                        <>
                          <span className="text-gray-500 line-through mr-2">
                            ${bouncer.price.toFixed(2)}
                          </span>
                          <span className="text-green-600">
                            ${(bouncer.price * 0.5).toFixed(2)}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                ))}
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">Bouncer:</span>
              <span className="font-medium">{state.bouncerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Date:</span>
            <span className="font-medium">
              {formatDate(state.deliveryDate)}
              {state.deliveryTimePreference === "specific" &&
                ` at ${formatTime(state.deliveryTime)}`}
              {state.deliveryTimePreference === "flexible" &&
                " (Flexible Time)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pickup Date:</span>
            <span className="font-medium">
              {formatDate(state.pickupDate)}
              {state.pickupTimePreference === "specific" &&
                ` at ${formatTime(state.pickupTime)}`}
              {state.pickupTimePreference === "flexible" && " (Flexible Time)"}
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
              onClick={() => onEditStep("details")}
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
              onClick={() => onEditStep("extras")}
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
                    {extra.image} {extra.name}{" "}
                    {extra.id === "tablesChairs" && extra.quantity > 1
                      ? `(${extra.quantity}x)`
                      : ""}
                  </span>
                  <span className="font-medium">
                    $
                    {(
                      extra.price *
                      (extra.id === "tablesChairs" ? extra.quantity : 1)
                    ).toFixed(2)}
                    {extra.id === "tablesChairs" && extra.quantity > 1 && (
                      <span className="text-sm text-gray-500 ml-1">
                        (${extra.price.toFixed(2)} each)
                      </span>
                    )}
                  </span>
                </div>
              ))}

              {/* Selected Mixers */}
              {state.slushyMixers.filter((mixer) => mixer.mixerId !== "none")
                .length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Selected Mixers:
                  </h4>
                  {state.slushyMixers
                    .filter((mixer) => mixer.mixerId !== "none")
                    .map((mixer, index) => (
                      <div key={index} className="flex justify-between ml-4">
                        <span className="text-gray-600">
                          Tank {mixer.tankNumber}: {mixer.name}
                        </span>
                        <span className="font-medium">
                          ${mixer.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
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
          {/* Rental Duration */}
          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-800">
                Rental Duration:
              </span>
              <span className="font-medium text-blue-800">
                {!state.rentalDays || state.rentalDays === 1
                  ? "Same Day (Base Price)"
                  : state.rentalDays === 2
                    ? "Overnight Rental"
                    : `${state.rentalDays - 1} Days (${state.dayMultiplier || state.rentalDays - 1}x Base Price)`}
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {!state.rentalDays || state.rentalDays === 1
                ? "Delivered and picked up on the same day."
                : state.rentalDays === 2
                  ? "Overnight rental includes the 'Overnight Rental' extra."
                  : `Multi-day rental: Base price × ${state.dayMultiplier || state.rentalDays - 1} for all bouncers and extras.`}
            </p>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Bouncers:</span>
            <span className="font-medium">
              $
              {state.selectedBouncers.length > 0
                ? state.selectedBouncers
                    .reduce(
                      (sum, bouncer) =>
                        sum + (bouncer.discountedPrice || bouncer.price),
                      0,
                    )
                    .toFixed(2)
                : state.bouncerPrice.toFixed(2)}
              {state.dayMultiplier && state.dayMultiplier > 1 && (
                <span className="text-sm text-gray-500 ml-1">
                  (×{state.dayMultiplier})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Extras:</span>
            <span className="font-medium">
              $
              {(
                state.extras
                  .filter(
                    (extra) =>
                      // Exclude the "overnight" extra when it's automatically selected for overnight rentals
                      extra.selected &&
                      (extra.id !== "overnight" ||
                        calculateRentalDays(
                          state.deliveryDate,
                          state.pickupDate,
                        ) !== 1),
                  )
                  .reduce((sum, extra) => {
                    const quantity =
                      extra.id === "tablesChairs" ? extra.quantity : 1;
                    return sum + extra.price * quantity;
                  }, 0) +
                state.slushyMixers
                  .filter((mixer) => mixer.mixerId !== "none")
                  .reduce((sum, mixer) => sum + mixer.price, 0)
              ).toFixed(2)}
              {state.dayMultiplier && state.dayMultiplier > 1 && (
                <span className="text-sm text-gray-500 ml-1">
                  (×{state.dayMultiplier})
                </span>
              )}
            </span>
          </div>
          {/* Overnight fee is now handled as an extra */}
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-medium text-green-600">FREE</span>
          </div>
          {state.specificTimeCharge > 0 && (
            <>
              {state.deliveryTimePreference === "specific" &&
              state.pickupTimePreference === "specific" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Specific Delivery Time Fee:
                    </span>
                    <span className="font-medium">$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Specific Pickup Time Fee:
                    </span>
                    <span className="font-medium">$10.00</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {state.deliveryTimePreference === "specific"
                      ? "Specific Delivery Time Fee:"
                      : "Specific Pickup Time Fee:"}
                  </span>
                  <span className="font-medium">
                    ${state.specificTimeCharge.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${state.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (8.25%):</span>
            <span className="font-medium">${state.taxAmount.toFixed(2)}</span>
          </div>
          {state.paymentMethod !== "cash" && (
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Fee (3%):</span>
              <span className="font-medium">
                ${state.processingFee.toFixed(2)}
              </span>
            </div>
          )}
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
          {state.depositAmount > 0 && (
            <>
              <div className="flex justify-between text-blue-600">
                <span>Deposit Amount (Now):</span>
                <span>${state.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Balance Due (On Delivery):</span>
                <span>${state.balanceDue.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex items-start mb-2">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={state.agreedToTerms}
            onChange={() => dispatch({ type: "TOGGLE_AGREED_TO_TERMS" })}
            className="mt-1 h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
          />
          <label htmlFor="agreeToTerms" className="ml-2 text-blue-800 text-sm">
            I agree to the{" "}
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
          </label>
        </div>
        {state.errors.agreedToTerms && (
          <p className="text-red-500 text-xs mt-1">
            {state.errors.agreedToTerms}
          </p>
        )}
      </div>
    </div>
  );
};

export default Step4_OrderReview;
