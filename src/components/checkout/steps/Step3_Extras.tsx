"use client";

import React, { useEffect } from "react";
import { CheckoutState } from "../utils/types";
import { calculatePrices } from "../utils/priceCalculation";

interface Step3Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
}

const Step3_Extras: React.FC<Step3Props> = ({ state, dispatch }) => {
  // Update prices whenever extras selection changes
  useEffect(() => {
    const prices = calculatePrices(state);
    dispatch({ type: "UPDATE_PRICES", payload: prices });
  }, [state.extras, state.bouncerPrice, dispatch]);

  // Handle toggling an extra
  const handleToggleExtra = (extraId: string) => {
    dispatch({ type: "TOGGLE_EXTRA", payload: extraId });
  };

  // Handle incrementing quantity
  const handleIncrementQuantity = (extraId: string) => {
    dispatch({ type: "INCREMENT_EXTRA_QUANTITY", payload: extraId });
  };

  // Handle decrementing quantity
  const handleDecrementQuantity = (extraId: string) => {
    dispatch({ type: "DECREMENT_EXTRA_QUANTITY", payload: extraId });
  };

  // Calculate the total price of selected extras
  const selectedExtrasTotal = state.extras
    .filter((extra) => extra.selected)
    .reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
    
  // Calculate total quantity of selected extras
  const selectedExtrasCount = state.extras
    .filter((extra) => extra.selected)
    .reduce((sum, extra) => {
      // Only count multiple quantities for Tables & Chairs
      const quantity = extra.id === "tablesChairs" ? extra.quantity : 1;
      return sum + quantity;
    }, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Add Extras</h2>

      <p className="text-gray-600">
        Enhance your bounce house rental with these popular add-ons!
      </p>

      {/* Extras Grid */}
      {state.extras.length === 0 ? (
        <div className="bg-yellow-50 p-6 rounded-lg text-center">
          <p className="text-yellow-800 font-medium">
            No extras are currently available from our inventory.
          </p>
          <p className="text-yellow-700 mt-2">
            Please continue with your bouncer selection or contact us for
            special requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.extras.map((extra) => (
              <div
                key={extra.id}
                className={`border rounded-lg p-4 transition-all ${
                  extra.selected
                    ? "border-primary-purple bg-primary-purple/5"
                    : "border-gray-200 hover:border-primary-purple/50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className="pt-1 cursor-pointer"
                    onClick={() => handleToggleExtra(extra.id)}
                  >
                    <div
                      className={`w-6 h-6 flex-shrink-0 rounded-md border flex items-center justify-center ${
                        extra.selected
                          ? "bg-primary-purple border-primary-purple text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {extra.selected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium cursor-pointer" onClick={() => handleToggleExtra(extra.id)}>
                        {extra.image} {extra.name}
                      </span>
                      <span className="text-lg font-semibold text-primary-purple">
                        ${extra.price}
                      </span>
                    </div>
                    
                    {extra.selected && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          {extra.id === "tablesChairs" ? (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleDecrementQuantity(extra.id)}
                                disabled={extra.quantity <= 1}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                  extra.quantity <= 1
                                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                    : "border-primary-purple text-primary-purple hover:bg-primary-purple/10"
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                              <span className="text-lg font-medium w-8 text-center">
                                {extra.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleIncrementQuantity(extra.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center border border-primary-purple text-primary-purple hover:bg-primary-purple/10"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Quantity: 1
                            </div>
                          )}
                          <span className="font-semibold text-primary-purple">
                            ${(extra.price * (extra.id === "tablesChairs" ? extra.quantity : 1)).toFixed(2)}
                          </span>
                        </div>
                        {extra.id === "tablesChairs" && (
                          <p className="text-sm text-gray-500 mt-2">
                            Each set includes 1 table and 6 chairs
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Selected Extras:</span>
          <span className="font-semibold">
            {state.extras.filter((e) => e.selected).length} types ({selectedExtrasCount} items)
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-700">Extras Total:</span>
          <span className="font-semibold">
            ${selectedExtrasTotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-700">Bouncer:</span>
          <span className="font-semibold">
            ${state.bouncerPrice.toFixed(2)}
          </span>
        </div>
        {state.specificTimeCharge > 0 && (
          <>
            {state.deliveryTimePreference === "specific" && state.pickupTimePreference === "specific" ? (
              <>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-700">Specific Delivery Time Fee:</span>
                  <span className="font-semibold">$20.00</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-700">Specific Pickup Time Fee:</span>
                  <span className="font-semibold">$20.00</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">
                  {state.deliveryTimePreference === "specific" 
                    ? "Specific Delivery Time Fee:" 
                    : "Specific Pickup Time Fee:"}
                </span>
                <span className="font-semibold">
                  ${state.specificTimeCharge.toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}
        <div className="border-t border-gray-200 my-2"></div>
        <div className="flex justify-between items-center font-semibold">
          <span>Subtotal:</span>
          <span>${state.subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* No extras selected message */}
      {!state.extras.some((e) => e.selected) && state.selectedBouncer && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            You haven't selected any extras yet. That's okay! You can continue
            with just the bounce house rental.
          </p>
        </div>
      )}

      {/* No bouncer selected message */}
      {!state.selectedBouncer && !state.extras.some((e) => e.selected) && (
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-800">
            <strong>Note:</strong> You haven't selected a bouncer or any extras
            yet. Please select at least one item to continue.
          </p>
          {state.errors.extras && (
            <p className="text-red-500 mt-2 font-medium">
              {state.errors.extras}
            </p>
          )}
        </div>
      )}

      {/* Extras-only order message */}
      {!state.selectedBouncer && state.extras.some((e) => e.selected) && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            <strong>Extras-Only Order:</strong> You're ordering extras without a
            bouncer. That's fine! You can proceed with just the selected extras.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3_Extras;
