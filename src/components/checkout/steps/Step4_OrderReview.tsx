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
    const prices = calculatePrices(state);
    dispatch({ type: "UPDATE_PRICES", payload: prices });

    // Update balance due
    dispatch({ type: "UPDATE_BALANCE_DUE" });

    // Reset deposit amount to 0 when payment method is cash
    if (state.paymentMethod === "cash" && state.depositAmount > 0) {
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
              onClick={() => onEditStep("delivery")}
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

      {/* Payment Method Selection */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Payment Method</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="paypal"
                name="paymentMethod"
                checked={state.paymentMethod === "paypal"}
                onChange={() =>
                  dispatch({ type: "SET_PAYMENT_METHOD", payload: "paypal" })
                }
                className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300"
              />
              <label htmlFor="paypal" className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                  className="w-6 h-6 text-blue-600"
                  fill="currentColor"
                >
                  <path d="M186.3 258.2c0 12.2-9.7 21.5-22 21.5-9.2 0-16-5.2-16-15 0-12.2 9.5-22 21.7-22 9.3 0 16.3 5.7 16.3 15.5zM80.5 209.7h-4.7c-1.5 0-3 1-3.2 2.7l-4.3 26.7 8.2-.3c11 0 19.5-1.5 21.5-14.2 2.3-13.4-6.2-14.9-17.5-14.9zm284 0H360c-1.8 0-3 1-3.2 2.7l-4.2 26.7 8-.3c13 0 22-3 22-18-.1-10.6-9.6-11.1-18.1-11.1zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM128.3 215.4c0-21-16.2-28-34.7-28h-40c-2.5 0-5 2-5.2 4.7L32 294.2c-.3 2 1.2 4 3.2 4h19c2.7 0 5.2-2.9 5.5-5.7l4.5-26.6c1-7.2 13.2-4.7 18-4.7 28.6 0 46.1-17 46.1-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.2 8.2-5.8-8.5-14.2-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9 0 20.2-4.9 26.5-11.9-.5 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H200c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm40.5 97.9l63.7-92.6c.5-.5.5-1 .5-1.7 0-1.7-1.5-3.5-3.2-3.5h-19.2c-1.7 0-3.5 1-4.5 2.5l-26.5 39-11-37.5c-.8-2.2-3-4-5.5-4h-18.7c-1.7 0-3.2 1.8-3.2 3.5 0 1.2 19.5 56.8 21.2 62.1-2.7 3.8-20.5 28.6-20.5 31.6 0 1.8 1.5 3.2 3.2 3.2h19.2c1.8-.1 3.5-1.1 4.5-2.6zm159.3-106.7c0-21-16.2-28-34.7-28h-39.7c-2.7 0-5.2 2-5.5 4.7l-16.2 102c-.2 2 1.3 4 3.2 4h20.5c2 0 3.5-1.5 4-3.2l4.5-29c1-7.2 13.2-4.7 18-4.7 28.4 0 45.9-17 45.9-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.3 8.2-5.5-8.5-14-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9.3 0 20.5-4.9 26.5-11.9-.3 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H484c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm47.5-33.3c0-2-1.5-3.5-3.2-3.5h-18.5c-1.5 0-3 1.2-3.2 2.7l-16.2 104-.3.5c0 1.8 1.5 3.5 3.5 3.5h16.5c2.5 0 5-2.9 5.2-5.7L544 191.2v-.3zm-90 51.8c-12.2 0-21.7 9.7-21.7 22 0 9.7 7 15 16.2 15 12 0 21.7-9.2 21.7-21.5.1-9.8-6.9-15.5-16.2-15.5z" />
                </svg>
                <span className="font-medium">PayPal (Pay Now)</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="cash"
                name="paymentMethod"
                checked={state.paymentMethod === "cash"}
                onChange={() => {
                  dispatch({ type: "SET_PAYMENT_METHOD", payload: "cash" });
                  // Reset deposit amount to 0 for cash payments
                  dispatch({ type: "SET_DEPOSIT_AMOUNT", payload: 0 });
                  dispatch({ type: "UPDATE_BALANCE_DUE" });
                }}
                className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300"
              />
              <label htmlFor="cash" className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">
                  Cash on Delivery (Pay Later)
                </span>
              </label>
            </div>
          </div>

          {/* Payment method explanations */}
          <div className="mt-4">
            {state.paymentMethod === "paypal" && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>PayPal:</strong> You'll be redirected to PayPal to
                  complete your payment securely.
                  {state.depositAmount > 0 ? (
                    <span>
                      {" "}
                      You'll pay the deposit amount of $
                      {state.depositAmount.toFixed(2)} now.
                    </span>
                  ) : (
                    <span>
                      {" "}
                      You'll pay the full amount of $
                      {state.totalAmount.toFixed(2)} now.
                    </span>
                  )}
                </p>
              </div>
            )}

            {state.paymentMethod === "cash" && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Cash on Delivery:</strong> No payment required now.
                  <span>
                    {" "}
                    You'll pay the full amount of $
                    {state.totalAmount.toFixed(2)} in cash when we deliver your
                    order.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Options - Only show for PayPal */}
      {state.paymentMethod === "paypal" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">
              Deposit Options
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="fullPayment"
                  name="depositOption"
                  checked={state.depositAmount === 0}
                  onChange={() => {
                    dispatch({ type: "SET_DEPOSIT_AMOUNT", payload: 0 });
                    dispatch({ type: "UPDATE_BALANCE_DUE" });
                  }}
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300"
                />
                <label htmlFor="fullPayment" className="text-gray-700">
                  Pay in Full (${state.totalAmount.toFixed(2)})
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="depositPayment"
                  name="depositOption"
                  checked={state.depositAmount > 0}
                  onChange={() => {
                    // Set deposit to 50% of total (rounded to nearest dollar)
                    const deposit = Math.round(state.totalAmount * 0.5);
                    dispatch({ type: "SET_DEPOSIT_AMOUNT", payload: deposit });
                    dispatch({ type: "UPDATE_BALANCE_DUE" });
                  }}
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300"
                />
                <label htmlFor="depositPayment" className="text-gray-700">
                  Pay 50% Deposit Now ($
                  {Math.round(state.totalAmount * 0.5).toFixed(2)})
                </label>
              </div>
            </div>

            {state.depositAmount > 0 && (
              <div className="bg-blue-50 p-3 rounded-md mt-3">
                <p className="text-sm text-blue-800">
                  <strong>Deposit Payment:</strong> You'll pay $
                  {state.depositAmount.toFixed(2)} now, and the remaining
                  balance of ${state.balanceDue.toFixed(2)} will be due on the
                  day of delivery.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
