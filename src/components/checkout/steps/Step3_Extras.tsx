"use client";

import { useEffect } from "react";
import { CheckoutState } from "../utils/checkoutReducer";
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

  // Calculate the total price of selected extras
  const selectedExtrasTotal = state.extras
    .filter((extra) => extra.selected)
    .reduce((sum, extra) => sum + extra.price, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Add Extras</h2>
      
      <p className="text-gray-600">
        Enhance your bounce house rental with these popular add-ons!
      </p>

      {/* Extras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.extras.map((extra) => (
          <div
            key={extra.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              extra.selected
                ? "border-primary-purple bg-primary-purple/5"
                : "border-gray-200 hover:border-primary-purple/50"
            }`}
            onClick={() => handleToggleExtra(extra.id)}
          >
            <div className="flex items-center space-x-3">
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
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">
                    {extra.image} {extra.name}
                  </span>
                  <span className="text-lg font-semibold text-primary-purple">
                    ${extra.price}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Selected Extras:</span>
          <span className="font-semibold">
            {state.extras.filter((e) => e.selected).length} items
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-700">Extras Total:</span>
          <span className="font-semibold">${selectedExtrasTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-700">Bouncer:</span>
          <span className="font-semibold">${state.bouncerPrice.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
        <div className="flex justify-between items-center font-semibold">
          <span>Subtotal:</span>
          <span>${state.subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* No extras selected message */}
      {!state.extras.some((e) => e.selected) && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            You haven't selected any extras yet. That's okay! You can continue
            with just the bounce house rental.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3_Extras;
