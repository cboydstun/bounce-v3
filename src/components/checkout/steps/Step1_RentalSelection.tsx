"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getProducts } from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CheckoutState } from "../utils/types";

interface Specification {
  name: string;
  value: string | string[];
  _id: string;
}

interface Bouncer {
  _id: string;
  name: string;
  images: Array<{ url: string; alt: string }>;
  specifications: Specification[];
  price?: {
    base: number;
    currency: string;
  };
  extractedPrice?: number;
}

interface Step1Props {
  state: CheckoutState;
  dispatch: React.Dispatch<any>;
}

const Step1_RentalSelection: React.FC<Step1Props> = ({ state, dispatch }) => {
  const [bouncers, setBouncers] = useState<Bouncer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBouncerImage, setSelectedBouncerImage] = useState<string>("");

  // Fetch bouncers on component mount
  useEffect(() => {
    const fetchBouncers = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProducts();

        // Extract products array from the response
        const productsArray = data.products || [];

        // Filter for bouncer products
        const filteredBouncers = productsArray.filter((product: Bouncer) => {
          const typeSpec = product.specifications?.find(
            (spec) => spec.name === "Type",
          );
          if (!typeSpec) return false;

          if (Array.isArray(typeSpec.value)) {
            return typeSpec.value.some((v) => v === "WET" || v === "DRY");
          }
          return typeSpec.value === "WET" || typeSpec.value === "DRY";
        });

        // Extract price from product.price.base
        const bouncersWithPrice = filteredBouncers.map((bouncer: Bouncer) => {
          let price = 0;
          if (bouncer.price && bouncer.price.base) {
            price = bouncer.price.base;
          }
          return { ...bouncer, extractedPrice: price };
        });

        setBouncers(bouncersWithPrice);

        // If there's a previously selected bouncer, set the image
        if (state.selectedBouncer) {
          const selectedBouncer = bouncersWithPrice.find(
            (b: Bouncer) => b._id === state.selectedBouncer,
          );
          if (selectedBouncer && selectedBouncer.images[0]?.url) {
            setSelectedBouncerImage(selectedBouncer.images[0].url);
          }
        }
      } catch (error) {
        console.error("Error fetching bouncers:", error);
        setLoadError("Failed to load bouncers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBouncers();
  }, [state.selectedBouncer]);

  // Handle bouncer selection
  const handleBouncerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedBouncer = bouncers.find((b) => b._id === selectedId);

    if (selectedBouncer) {
      setSelectedBouncerImage(selectedBouncer.images[0]?.url || "");
      dispatch({
        type: "SET_BOUNCER",
        payload: {
          id: selectedBouncer._id,
          name: selectedBouncer.name,
          price: selectedBouncer.extractedPrice || 0,
        },
      });
    } else {
      setSelectedBouncerImage("");
      dispatch({
        type: "SET_BOUNCER",
        payload: { id: "", name: "", price: 0 },
      });
    }
  };

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Select Your Rental
      </h2>

      {/* Bouncer Selection */}
      <div className="space-y-2">
        <label
          htmlFor="bouncer-select"
          className="block text-lg font-medium text-gray-700"
        >
          🎪 Select a Bouncer
        </label>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        ) : loadError ? (
          <div className="text-red-500">{loadError}</div>
        ) : (
          <select
            id="bouncer-select"
            value={state.selectedBouncer}
            onChange={handleBouncerChange}
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          >
            <option value="">Choose a bouncer...</option>
            {bouncers.map((bouncer) => {
              const typeSpec = bouncer.specifications.find(
                (spec) => spec.name === "Type",
              );
              const type = Array.isArray(typeSpec?.value)
                ? typeSpec.value.join("/")
                : typeSpec?.value;
              return (
                <option key={bouncer._id} value={bouncer._id}>
                  {bouncer.name} ({type}) - ${bouncer.extractedPrice}
                </option>
              );
            })}
          </select>
        )}
        {state.errors.selectedBouncer && (
          <p className="text-red-500 text-sm mt-1">
            {state.errors.selectedBouncer}
          </p>
        )}
      </div>

      {/* Selected Bouncer Image */}
      {selectedBouncerImage && (
        <div className="rounded-xl overflow-hidden shadow-md">
          <Image
            src={selectedBouncerImage}
            alt="Selected bouncer"
            className="w-full h-full object-cover"
            width={800}
            height={600}
          />
        </div>
      )}

      {/* Delivery Date and Time */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="delivery-date"
              className="block text-lg font-medium text-gray-700"
            >
              📅 Delivery Date
            </label>
            <input
              type="date"
              id="delivery-date"
              value={state.deliveryDate}
              onChange={(e) =>
                dispatch({ type: "SET_DELIVERY_DATE", payload: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]} // Today or later
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
            />
            {state.errors.deliveryDate && (
              <p className="text-red-500 text-sm mt-1">
                {state.errors.deliveryDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="delivery-time-preference"
              className="block text-lg font-medium text-gray-700"
            >
              ⏰ Delivery Time Preference
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
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
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple"
                />
                <span>Flexible (Free)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
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
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple"
                />
                <span>Specific Time (+$20)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="delivery-time"
              className="block text-lg font-medium text-gray-700"
            >
              🕒 Delivery Time
            </label>
            <select
              id="delivery-time"
              value={state.deliveryTime}
              onChange={(e) =>
                dispatch({ type: "SET_DELIVERY_TIME", payload: e.target.value })
              }
              disabled={state.deliveryTimePreference === "flexible"}
              className={`w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 ${
                state.deliveryTimePreference === "flexible"
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
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
            {state.deliveryTimePreference === "flexible" && (
              <p className="text-gray-500 text-sm italic">
                We'll contact you to arrange a delivery window
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            {/* Empty div for grid alignment */}
          </div>
        </div>
      </div>

      {/* Pickup Date and Time */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="pickup-date"
              className="block text-lg font-medium text-gray-700"
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
              min={state.deliveryDate || new Date().toISOString().split("T")[0]} // Delivery date or today
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
            />
            {state.errors.pickupDate && (
              <p className="text-red-500 text-sm mt-1">
                {state.errors.pickupDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pickup-time-preference"
              className="block text-lg font-medium text-gray-700"
            >
              ⏰ Pickup Time Preference
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
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
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple"
                />
                <span>Flexible (Free)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
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
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple"
                />
                <span>Specific Time (+$20)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="pickup-time"
              className="block text-lg font-medium text-gray-700"
            >
              🕒 Pickup Time
            </label>
            <select
              id="pickup-time"
              value={state.pickupTime}
              onChange={(e) =>
                dispatch({ type: "SET_PICKUP_TIME", payload: e.target.value })
              }
              disabled={state.pickupTimePreference === "flexible"}
              className={`w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 ${
                state.pickupTimePreference === "flexible"
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
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
            {state.pickupTimePreference === "flexible" && (
              <p className="text-gray-500 text-sm italic">
                We'll contact you to arrange a pickup window
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            {/* Empty div for grid alignment */}
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {state.deliveryDate && state.pickupDate && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            Your rental will be delivered on{" "}
            <strong>
              {new Date(state.deliveryDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
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
              <strong> (flexible time)</strong>
            )}{" "}
            and picked up on{" "}
            <strong>
              {new Date(state.pickupDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
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
              <strong> (flexible time)</strong>
            )}
            .
            {state.specificTimeCharge > 0 && (
              <span className="block mt-2 text-sm">
                Note: A $20 fee is added for each specific time selection (delivery and/or pickup).
                {state.deliveryTimePreference === "specific" && state.pickupTimePreference === "specific" && 
                  " You have selected both specific delivery and pickup times ($100 total)."
                }
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default Step1_RentalSelection;
