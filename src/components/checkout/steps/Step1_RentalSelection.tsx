"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getProducts } from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BouncerItem, CheckoutState, AvailabilityResult } from "../utils/types";
import { checkAvailabilityForProducts } from "@/utils/availability";
import { toast } from "react-hot-toast"; // Assuming you use this for notifications

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
  const [selectedBouncerId, setSelectedBouncerId] = useState<string>("");
  const [selectedBouncerImage, setSelectedBouncerImage] = useState<string>("");
  const [isAddingMore, setIsAddingMore] = useState<boolean>(false);

  // Helper function to determine if a product is available
  const isProductAvailable = (bouncer: Bouncer) => {
    if (!state.deliveryDate || state.availabilityChecks.status !== "success") {
      return true; // No date selected yet or availability check not completed
    }

    // Try to find availability result using _id
    const result = state.availabilityChecks.results[bouncer._id];
    return result?.available !== false;
  };

  // Helper to get unavailability reason
  const getUnavailabilityReason = (bouncer: Bouncer) => {
    // Try to find availability result using _id
    const result = state.availabilityChecks.results[bouncer._id];
    return result?.reason || "Unavailable on selected date";
  };

  // Ensure pickup date matches delivery date when component loads or delivery date changes
  useEffect(() => {
    if (
      state.deliveryDate &&
      (!state.pickupDate || state.pickupDate < state.deliveryDate)
    ) {
      dispatch({ type: "SET_PICKUP_DATE", payload: state.deliveryDate });
    }
  }, [state.deliveryDate, state.pickupDate, dispatch]);

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

  // Handle bouncer dropdown selection
  const handleBouncerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    // If this is the first bouncer selection, add it automatically
    if (selectedId && state.selectedBouncers.length === 0 && !isAddingMore) {
      const selectedBouncer = bouncers.find((b) => b._id === selectedId);
      if (selectedBouncer) {
        // Add the bouncer to the order
        dispatch({
          type: "ADD_BOUNCER",
          payload: {
            id: selectedBouncer._id,
            name: selectedBouncer.name,
            price: selectedBouncer.extractedPrice || 0,
            image: selectedBouncer.images[0]?.url,
          },
        });

        // Calculate discounts
        dispatch({ type: "CALCULATE_BOUNCER_DISCOUNTS" });

        // Clear the selection
        setSelectedBouncerId("");
        setSelectedBouncerImage("");
      }
    } else {
      // For additional bouncers, just update the selection
      setSelectedBouncerId(selectedId);

      const selectedBouncer = bouncers.find((b) => b._id === selectedId);
      if (selectedBouncer) {
        setSelectedBouncerImage(selectedBouncer.images[0]?.url || "");
      } else {
        setSelectedBouncerImage("");
      }
    }
  };

  // Add the selected bouncer to the order
  const handleAddBouncer = () => {
    if (!selectedBouncerId) return;

    const selectedBouncer = bouncers.find((b) => b._id === selectedBouncerId);
    if (!selectedBouncer) return;

    // Check if we already have 3 bouncers
    if (state.selectedBouncers.length >= 3) {
      alert("You can only select up to 3 bouncers.");
      return;
    }

    // Check if this bouncer is already selected
    if (state.selectedBouncers.some((b) => b.id === selectedBouncerId)) {
      alert("This bouncer is already in your order.");
      return;
    }

    // Add the bouncer to the order
    dispatch({
      type: "ADD_BOUNCER",
      payload: {
        id: selectedBouncer._id,
        name: selectedBouncer.name,
        price: selectedBouncer.extractedPrice || 0,
        image: selectedBouncer.images[0]?.url,
      },
    });

    // Calculate discounts
    dispatch({ type: "CALCULATE_BOUNCER_DISCOUNTS" });

    // Clear the selection
    setSelectedBouncerId("");
    setSelectedBouncerImage("");

    // Exit "adding more" mode after adding a bouncer
    setIsAddingMore(false);
  };

  // Remove a bouncer from the order
  const handleRemoveBouncer = (id: string) => {
    dispatch({ type: "REMOVE_BOUNCER", payload: id });

    // Recalculate discounts
    if (state.selectedBouncers.length > 1) {
      dispatch({ type: "CALCULATE_BOUNCER_DISCOUNTS" });
    }
  };

  // Update the quantity of a bouncer
  const handleUpdateQuantity = (id: string, quantity: number) => {
    dispatch({
      type: "UPDATE_BOUNCER_QUANTITY",
      payload: { id, quantity },
    });

    // Recalculate discounts
    dispatch({ type: "CALCULATE_BOUNCER_DISCOUNTS" });
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
      <div className="space-y-4">
        <div>
          {/* Selected Bouncers List */}
          {state.selectedBouncers.length > 0 && (
            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-medium text-gray-700">
                Selected Bouncers
              </h3>
              <div className="space-y-3">
                {state.selectedBouncers.map((bouncer, index) => (
                  <div
                    key={bouncer.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Bouncer Image */}
                        {bouncer.image && (
                          <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={bouncer.image}
                              alt={bouncer.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Bouncer Name */}
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {bouncer.name}
                          </h4>
                          {/* Price Badge */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {index === 0 ? (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                Full Price
                              </span>
                            ) : (
                              <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                50% Off
                              </span>
                            )}

                            {/* Availability Badge */}
                            {state.availabilityChecks.status === "success" && (
                              <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded">
                                Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price and Remove Button */}
                      <div className="flex flex-col items-end">
                        <div className="text-right">
                          {index === 0 ? (
                            <span className="font-medium">
                              ${bouncer.price.toFixed(2)}
                            </span>
                          ) : (
                            <div>
                              <span className="text-gray-500 line-through mr-2">
                                ${bouncer.price.toFixed(2)}
                              </span>
                              <span className="font-medium text-green-600">
                                ${(bouncer.price * 0.5).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBouncer(bouncer.id)}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <label
            htmlFor="bouncer-select"
            className="block text-lg font-medium text-gray-700"
          >
            🎪 Select Bouncer
          </label>

          {isLoading ? (
            <div className="flex justify-center py-4 w-full">
              <LoadingSpinner />
            </div>
          ) : loadError ? (
            <div className="text-red-500">{loadError}</div>
          ) : (
            <>
              {/* Show dropdown for first selection or when adding more */}
              {state.selectedBouncers.length === 0 || isAddingMore ? (
                <div className="flex gap-2 mt-2">
                  <select
                    id="bouncer-select"
                    value={selectedBouncerId}
                    onChange={handleBouncerChange}
                    className="flex-grow rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 bg-gray-50"
                    disabled={state.selectedBouncers.length >= 3}
                  >
                    <option value="">Choose a bouncer...</option>
                    {bouncers.map((bouncer) => {
                      const typeSpec = bouncer.specifications.find(
                        (spec) => spec.name === "Type",
                      );
                      const type = Array.isArray(typeSpec?.value)
                        ? typeSpec.value.join("/")
                        : typeSpec?.value;
                      const available = isProductAvailable(bouncer);
                      const availabilityText = !available
                        ? " (Unavailable)"
                        : state.availabilityChecks.status === "success"
                          ? " (Available)"
                          : "";

                      return (
                        <option
                          key={bouncer._id}
                          value={bouncer._id}
                          disabled={
                            state.selectedBouncers.some(
                              (b) => b.id === bouncer._id,
                            ) || !available
                          }
                        >
                          {bouncer.name} ({type}) - ${bouncer.extractedPrice}
                          {availabilityText}
                        </option>
                      );
                    })}
                  </select>

                  {/* Only show Add button when adding more bouncers */}
                  {isAddingMore && (
                    <button
                      type="button"
                      onClick={handleAddBouncer}
                      disabled={
                        !selectedBouncerId || state.selectedBouncers.length >= 3
                      }
                      className={`px-4 py-3 rounded-lg font-medium ${
                        !selectedBouncerId || state.selectedBouncers.length >= 3
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary-purple text-white hover:bg-primary-purple/90"
                      }`}
                    >
                      Add
                    </button>
                  )}
                </div>
              ) : (
                /* Show "Add More Bouncers" button when at least one bouncer is selected */
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingMore(true)}
                    disabled={state.selectedBouncers.length >= 3}
                    className={`px-4 py-3 rounded-lg font-medium ${
                      state.selectedBouncers.length >= 3
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary-purple text-white hover:bg-primary-purple/90"
                    }`}
                  >
                    Add More Bouncers
                  </button>
                </div>
              )}
            </>
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

        {/* Pricing Explanation */}
        <div className="mt-4 bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Multiple Bouncer Discount:</strong> The most expensive
            bouncer will be charged at full price, with additional bouncers at
            50% off, regardless of selection order.
          </p>
        </div>
      </div>

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
              onChange={async (e) => {
                const selectedDate = e.target.value;

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
                  // Check availability for all bounce house products with a single API call
                  const results = await checkAvailabilityForProducts(
                    bouncers,
                    selectedDate,
                  );

                  // Update state with results
                  dispatch({
                    type: "SET_AVAILABILITY_RESULTS",
                    payload: { results },
                  });

                  // Check if any selected bouncers were removed
                  // Handle potential ID format mismatches by checking both formats
                  const removedBouncers = state.selectedBouncers.filter(
                    (bouncer) => {
                      // First try with the bouncer.id (which should match _id from the database)
                      const result = results[bouncer.id];
                      return result?.available === false;
                    },
                  );

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
              }}
              min={new Date().toISOString().split("T")[0]} // Today or later
              className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 bg-gray-50"
            />
            {state.errors.deliveryDate && (
              <p className="text-red-500 text-sm mt-1">
                {state.errors.deliveryDate}
              </p>
            )}

            {/* Show loading indicator during availability check */}
            {state.availabilityChecks.status === "loading" && (
              <div className="flex items-center justify-center py-2 mt-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-blue-800">
                  Checking availability...
                </span>
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
                  onClick={async () => {
                    if (!state.deliveryDate) return;

                    dispatch({
                      type: "CHECK_AVAILABILITY",
                      payload: { date: state.deliveryDate },
                    });

                    try {
                      // Check availability for all bounce house products with a single API call
                      const results = await checkAvailabilityForProducts(
                        bouncers,
                        state.deliveryDate,
                      );

                      // Update state with results
                      dispatch({
                        type: "SET_AVAILABILITY_RESULTS",
                        payload: { results },
                      });

                      // Check if any selected bouncers were removed
                      // Handle potential ID format mismatches by checking both formats
                      const removedBouncers = state.selectedBouncers.filter(
                        (bouncer) => {
                          // First try with the bouncer.id (which should match _id from the database)
                          const result = results[bouncer.id];
                          return result?.available === false;
                        },
                      );

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
                  }}
                  className="underline mt-1"
                >
                  Try again
                </button>
              </div>
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
                <span>Specific Time (+$10)</span>
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
              className={`w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 bg-gray-50`}
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
            {state.deliveryTimePreference === "flexible" ? (
              <p className="text-gray-500 text-sm italic">
                We will be there at or before the selected time
              </p>
            ) : (
              <p className="text-gray-500 text-sm italic">
                We will be there at the selected time
              </p>
            )}
          </div>

          <div className="space-y-2">{/* Empty div for grid alignment */}</div>
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
              className={
                "w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 bg-gray-50"
              }
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
                <span>Specific Time (+$10)</span>
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
              🕒{" "}
              {state.pickupTimePreference === "flexible"
                ? "When is the party over?"
                : "Delivery Time"}
            </label>
            <select
              id="pickup-time"
              value={state.pickupTime}
              onChange={(e) =>
                dispatch({ type: "SET_PICKUP_TIME", payload: e.target.value })
              }
              className={`w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3 bg-gray-50`}
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
            {state.pickupTimePreference === "flexible" ? (
              <p className="text-gray-500 text-sm italic">
                We will be there at or after the selected time
              </p>
            ) : (
              <p className="text-gray-500 text-sm italic">
                We will be there at the selected time
              </p>
            )}
          </div>

          <div className="space-y-2">{/* Empty div for grid alignment */}</div>
        </div>
      </div>

      {/* Validation Message */}
      {state.deliveryDate && state.pickupDate && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-800">
            Your rental will be delivered on{" "}
            <strong>
              {(() => {
                // Fix timezone issue by parsing the date parts
                const [year, month, day] = state.deliveryDate
                  .split("-")
                  .map(Number);
                const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                return date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });
              })()}
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
              {(() => {
                // Fix timezone issue by parsing the date parts
                const [year, month, day] = state.pickupDate
                  .split("-")
                  .map(Number);
                const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                return date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });
              })()}
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
              <span className="block mt-2 text-sm">
                Note: A $10 fee is added for each specific time selection
                (delivery and/or pickup).
                {state.deliveryTimePreference === "specific" &&
                  state.pickupTimePreference === "specific" &&
                  " You have selected both specific delivery and pickup times ($20 total)."}
              </span>
            )}
            {/* Multi-day pricing information */}
            {(() => {
              // Parse dates to ensure consistent behavior
              const [deliveryYear, deliveryMonth, deliveryDay] =
                state.deliveryDate.split("-").map(Number);
              const [pickupYear, pickupMonth, pickupDay] = state.pickupDate
                .split("-")
                .map(Number);

              // Create date objects (using noon to avoid timezone issues)
              const delivery = new Date(
                deliveryYear,
                deliveryMonth - 1,
                deliveryDay,
                12,
                0,
                0,
              );
              const pickup = new Date(
                pickupYear,
                pickupMonth - 1,
                pickupDay,
                12,
                0,
                0,
              );

              // Calculate the difference in days
              const diffTime = pickup.getTime() - delivery.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 0) {
                return null; // Same day rental, no additional message needed
              } else if (diffDays === 1) {
                return (
                  <span className="block mt-2 text-sm font-medium text-blue-800">
                    <strong>Overnight Rental:</strong> The "Overnight Rental"
                    extra will be automatically added to your order.
                  </span>
                );
              } else {
                return (
                  <span className="block mt-2 text-sm font-medium text-blue-800">
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

export default Step1_RentalSelection;
