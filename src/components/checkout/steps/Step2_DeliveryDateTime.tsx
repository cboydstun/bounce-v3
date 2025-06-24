"use client";

import { useEffect, useState } from "react";
import { CheckoutState } from "../utils/types";
import { checkAvailabilityForProducts } from "@/utils/availability";
import { toast } from "react-hot-toast";
import {
  formatDateCT,
  parseDateCT,
  formatDisplayDateCT,
  getCurrentDateCT,
} from "@/utils/dateUtils";

interface Step2Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
}

const Step2_DeliveryDateTime: React.FC<Step2Props> = ({ state, dispatch }) => {
  const [isDateAtCapacity, setIsDateAtCapacity] = useState<boolean>(false);
  const [dateCapacityMessage, setDateCapacityMessage] = useState<string>("");

  // Ensure pickup date matches delivery date when component loads or delivery date changes
  useEffect(() => {
    if (
      state.deliveryDate &&
      (!state.pickupDate || state.pickupDate < state.deliveryDate)
    ) {
      dispatch({ type: "SET_PICKUP_DATE", payload: state.deliveryDate });
    }
  }, [state.deliveryDate, state.pickupDate, dispatch]);

  // Generate time options (9 AM to 8 PM)
  const timeOptions = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9; // Start at 9 AM
    const amPm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour > 12 ? hour - 12 : hour;
    return {
      value: `${hour.toString().padStart(2, "0")}:00`,
      label: `${hour12}:00 ${amPm}`,
    };
  });

  const handleDateChange = async (selectedDate: string) => {
    // Update date in state
    dispatch({ type: "SET_DELIVERY_DATE", payload: selectedDate });
    // Also set pickup date to the same date
    dispatch({ type: "SET_PICKUP_DATE", payload: selectedDate });

    // Start availability check
    dispatch({
      type: "CHECK_AVAILABILITY",
      payload: { date: selectedDate },
    });

    try {
      // Get all products for availability check
      const response = await fetch("/api/v1/products");
      const data = await response.json();
      const products = data.products || [];

      // Filter for bouncer products
      const bouncers = products.filter((product: any) => {
        const typeSpec = product.specifications?.find(
          (spec: any) => spec.name === "Type",
        );
        if (!typeSpec) return false;

        if (Array.isArray(typeSpec.value)) {
          return typeSpec.value.some((v: string) => v === "WET" || v === "DRY");
        }
        return typeSpec.value === "WET" || typeSpec.value === "DRY";
      });

      // Check availability for all bounce house products
      const results = await checkAvailabilityForProducts(
        bouncers,
        selectedDate,
      );

      // Check if the date is a blackout date or at capacity
      if (results._meta && results._meta.isBlackoutDate) {
        setIsDateAtCapacity(true);
        setDateCapacityMessage(
          "This date is unavailable for booking. Please select another date or call 512-210-0194 to inquire about additional availability.",
        );
      } else if (results._meta && results._meta.dateAtCapacity) {
        setIsDateAtCapacity(true);
        setDateCapacityMessage(
          `This date has reached its maximum booking capacity (${results._meta.totalBookings}/${results._meta.maxBookings}). Please select another date or call 512-210-0194 to inquire about additional availability.`,
        );
      } else {
        setIsDateAtCapacity(false);
        setDateCapacityMessage("");
      }

      // Update state with results
      dispatch({
        type: "SET_AVAILABILITY_RESULTS",
        payload: { results },
      });

      // Check if any selected bouncers were removed
      const removedBouncers = state.selectedBouncers.filter((bouncer) => {
        const result = results[bouncer.id];
        return result?.available === false;
      });

      if (removedBouncers.length > 0) {
        toast(
          `${removedBouncers.length} bounce house(s) were removed from your order because they are unavailable on the selected date.`,
          {
            icon: "⚠️",
            style: {
              borderRadius: "10px",
              background: "#FEF3C7",
              color: "#92400E",
            },
          },
        );
      }
    } catch (error) {
      dispatch({ type: "SET_AVAILABILITY_ERROR" });
      toast.error(
        "Failed to check product availability. Please try again later.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          When do you need it?
        </h2>
        <p className="text-gray-600">
          Select your delivery date and time preferences
        </p>
      </div>

      {/* Selected Bouncers Summary */}
      {state.selectedBouncers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Your Selection:</h3>
          <div className="space-y-1">
            {state.selectedBouncers.map((bouncer, index) => (
              <div key={bouncer.id} className="flex justify-between text-sm">
                <span>{bouncer.name}</span>
                <span className="text-green-600">
                  {index === 0
                    ? `$${bouncer.price.toFixed(2)}`
                    : `$${(bouncer.price * 0.5).toFixed(2)} (50% off)`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Date */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="delivery-date"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            📅 Delivery Date
          </label>
          <input
            type="date"
            id="delivery-date"
            value={state.deliveryDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={formatDateCT(new Date())} // Today or later in Central Time
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-4 bg-gray-50 text-lg"
          />
          {state.errors.deliveryDate && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.deliveryDate}
            </p>
          )}

          {/* Show loading indicator during availability check */}
          {state.availabilityChecks.status === "loading" && (
            <div className="flex items-center justify-center py-3 mt-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-blue-800">
                Checking availability...
              </span>
            </div>
          )}

          {/* Show date capacity message if date is at capacity */}
          {isDateAtCapacity && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="text-sm">{dateCapacityMessage}</p>
            </div>
          )}

          {/* Show error message if availability check fails */}
          {state.availabilityChecks.status === "error" && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mt-2 text-sm">
              <p>
                Failed to check product availability. Available products may
                still be shown.
              </p>
              <button
                onClick={() => handleDateChange(state.deliveryDate)}
                className="underline mt-1"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Delivery Time Preference */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-3">
            ⏰ Delivery Time Preference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
              <input
                type="radio"
                name="delivery-time-preference"
                checked={state.deliveryTimePreference === "flexible"}
                onChange={() =>
                  dispatch({
                    type: "SET_DELIVERY_TIME_PREFERENCE",
                    payload: "flexible",
                  })
                }
                className="h-5 w-5 text-primary-purple focus:ring-primary-purple mt-0.5"
              />
              <div>
                <div className="font-medium">Flexible Timing</div>
                <div className="text-sm text-gray-600">
                  We'll arrive at or before your selected time
                </div>
                <div className="text-sm font-medium text-green-600">FREE</div>
              </div>
            </label>
            <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
              <input
                type="radio"
                name="delivery-time-preference"
                checked={state.deliveryTimePreference === "specific"}
                onChange={() =>
                  dispatch({
                    type: "SET_DELIVERY_TIME_PREFERENCE",
                    payload: "specific",
                  })
                }
                className="h-5 w-5 text-primary-purple focus:ring-primary-purple mt-0.5"
              />
              <div>
                <div className="font-medium">Specific Time</div>
                <div className="text-sm text-gray-600">
                  We'll arrive at your exact selected time
                </div>
                <div className="text-sm font-medium text-orange-600">+$10</div>
              </div>
            </label>
          </div>
        </div>

        {/* Delivery Time */}
        <div>
          <label
            htmlFor="delivery-time"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            🕒{" "}
            {state.deliveryTimePreference === "flexible"
              ? "What time is the party?"
              : "Delivery Time"}
          </label>
          <select
            id="delivery-time"
            value={state.deliveryTime}
            onChange={(e) =>
              dispatch({ type: "SET_DELIVERY_TIME", payload: e.target.value })
            }
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-4 bg-gray-50 text-lg"
          >
            <option value="">Select a time...</option>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.errors.deliveryTime && (
            <p className="text-red-500 text-sm mt-1">
              {state.errors.deliveryTime}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1 italic">
            {state.deliveryTimePreference === "flexible"
              ? "We will be there at or before the selected time"
              : "We will be there at the selected time"}
          </p>
        </div>

        {/* Pickup Date and Time */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="pickup-date"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              📅 Pickup Date
            </label>
            <input
              type="date"
              id="pickup-date"
              value={state.pickupDate}
              onChange={(e) =>
                dispatch({ type: "SET_PICKUP_DATE", payload: e.target.value })
              }
              min={state.deliveryDate || formatDateCT(new Date())}
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-4 bg-gray-50 text-lg"
            />
            {state.errors.pickupDate && (
              <p className="text-red-500 text-sm mt-1">
                {state.errors.pickupDate}
              </p>
            )}
          </div>

          {/* Pickup Time Preference */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">
              ⏰ Pickup Time Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="pickup-time-preference"
                  checked={state.pickupTimePreference === "flexible"}
                  onChange={() =>
                    dispatch({
                      type: "SET_PICKUP_TIME_PREFERENCE",
                      payload: "flexible",
                    })
                  }
                  className="h-5 w-5 text-primary-purple focus:ring-primary-purple mt-0.5"
                />
                <div>
                  <div className="font-medium">Flexible Timing</div>
                  <div className="text-sm text-gray-600">
                    We'll arrive at or after your selected time
                  </div>
                  <div className="text-sm font-medium text-green-600">FREE</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  name="pickup-time-preference"
                  checked={state.pickupTimePreference === "specific"}
                  onChange={() =>
                    dispatch({
                      type: "SET_PICKUP_TIME_PREFERENCE",
                      payload: "specific",
                    })
                  }
                  className="h-5 w-5 text-primary-purple focus:ring-primary-purple mt-0.5"
                />
                <div>
                  <div className="font-medium">Specific Time</div>
                  <div className="text-sm text-gray-600">
                    We'll arrive at your exact selected time
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    +$10
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Pickup Time */}
          <div>
            <label
              htmlFor="pickup-time"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              🕒{" "}
              {state.pickupTimePreference === "flexible"
                ? "When is the party over?"
                : "Pickup Time"}
            </label>
            <select
              id="pickup-time"
              value={state.pickupTime}
              onChange={(e) =>
                dispatch({ type: "SET_PICKUP_TIME", payload: e.target.value })
              }
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-4 bg-gray-50 text-lg"
            >
              <option value="">Select a time...</option>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.errors.pickupTime && (
              <p className="text-red-500 text-sm mt-1">
                {state.errors.pickupTime}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1 italic">
              {state.pickupTimePreference === "flexible"
                ? "We will be there at or after the selected time"
                : "We will be there at the selected time"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {state.deliveryDate &&
        state.pickupDate &&
        state.deliveryTime &&
        state.pickupTime && (
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">
              📋 Rental Summary
            </h3>
            <p className="text-blue-800 text-sm">
              Your rental will be delivered on{" "}
              <strong>
                {formatDisplayDateCT(parseDateCT(state.deliveryDate))}
              </strong>
              {state.deliveryTimePreference === "specific" ? (
                <>
                  {" "}
                  at{" "}
                  <strong>
                    {new Date(
                      `2000-01-01T${state.deliveryTime}`,
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </strong>
                </>
              ) : (
                <>
                  {" "}
                  at or before{" "}
                  <strong>
                    {new Date(
                      `2000-01-01T${state.deliveryTime}`,
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </strong>
                </>
              )}{" "}
              and picked up on{" "}
              <strong>
                {formatDisplayDateCT(parseDateCT(state.pickupDate))}
              </strong>
              {state.pickupTimePreference === "specific" ? (
                <>
                  {" "}
                  at{" "}
                  <strong>
                    {new Date(
                      `2000-01-01T${state.pickupTime}`,
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </strong>
                </>
              ) : (
                <>
                  {" "}
                  at or after{" "}
                  <strong>
                    {new Date(
                      `2000-01-01T${state.pickupTime}`,
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </strong>
                </>
              )}
              .
              {state.specificTimeCharge > 0 && (
                <span className="block mt-2 text-xs">
                  Note: A $10 fee is added for each specific time selection
                  (delivery and/or pickup).
                  {state.deliveryTimePreference === "specific" &&
                    state.pickupTimePreference === "specific" &&
                    " You have selected both specific delivery and pickup times ($20 total)."}
                </span>
              )}
              {/* Multi-day pricing information */}
              {(() => {
                const delivery = parseDateCT(state.deliveryDate);
                const pickup = parseDateCT(state.pickupDate);
                const diffTime = pickup.getTime() - delivery.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                  return null;
                } else if (diffDays === 1) {
                  return (
                    <span className="block mt-2 text-xs font-medium text-blue-800">
                      <strong>Overnight Rental:</strong> The "Overnight Rental"
                      extra will be automatically added to your order.
                    </span>
                  );
                } else {
                  return (
                    <span className="block mt-2 text-xs font-medium text-blue-800">
                      <strong>Multi-day Rental ({diffDays} days):</strong> Your
                      rental price will be multiplied by {diffDays}.
                    </span>
                  );
                }
              })()}
            </p>
          </div>
        )}
    </div>
  );
};

export default Step2_DeliveryDateTime;
