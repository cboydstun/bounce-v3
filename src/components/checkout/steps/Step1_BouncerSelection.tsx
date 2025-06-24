"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CheckoutState } from "../utils/types";
import ProductCard from "../ProductCard";
import { useFormFieldTracking } from "@/hooks/useFormFieldTracking";

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

const Step1_BouncerSelection: React.FC<Step1Props> = ({ state, dispatch }) => {
  const [bouncers, setBouncers] = useState<Bouncer[]>([]);
  const [filteredBouncers, setFilteredBouncers] = useState<Bouncer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "WET" | "DRY">("ALL");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "name">(
    "price-low",
  );

  // Use form field tracking hook
  const { trackFieldFocus, trackFieldBlur, trackFieldChange } =
    useFormFieldTracking();

  // Helper function to determine if a product is available
  const isProductAvailable = (bouncer: Bouncer) => {
    if (!state.deliveryDate || state.availabilityChecks.status !== "success") {
      return true; // No date selected yet or availability check not completed
    }

    const result = state.availabilityChecks.results[bouncer._id];
    return result?.available !== false;
  };

  // Helper to get unavailability reason
  const getUnavailabilityReason = (bouncer: Bouncer) => {
    const result = state.availabilityChecks.results[bouncer._id];
    return result?.reason || "Unavailable on selected date";
  };

  // Fetch bouncers on component mount
  useEffect(() => {
    const fetchBouncers = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProducts();
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
      } catch (error) {
        console.error("Error fetching bouncers:", error);
        setLoadError("Failed to load bounce houses. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBouncers();
  }, []);

  // Filter and sort bouncers when filters or sort options change
  useEffect(() => {
    let filtered = [...bouncers];

    // Apply type filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((bouncer) => {
        const typeSpec = bouncer.specifications.find(
          (spec) => spec.name === "Type",
        );
        if (Array.isArray(typeSpec?.value)) {
          return typeSpec.value.includes(typeFilter);
        }
        return typeSpec?.value === typeFilter;
      });
    }

    // Apply sorting
    filtered.sort((a: Bouncer, b: Bouncer) => {
      switch (sortBy) {
        case "price-low":
          return (a.extractedPrice || 0) - (b.extractedPrice || 0);
        case "price-high":
          return (b.extractedPrice || 0) - (a.extractedPrice || 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredBouncers(filtered);
  }, [bouncers, typeFilter, sortBy]);

  // Handle bouncer selection
  const handleBouncerSelect = (bouncerId: string) => {
    const selectedBouncer = bouncers.find((b) => b._id === bouncerId);
    if (!selectedBouncer) return;

    // Check if this bouncer is already selected
    const isAlreadySelected = state.selectedBouncers.some(
      (b) => b.id === bouncerId,
    );

    if (isAlreadySelected) {
      // Track deselection
      trackFieldChange("bouncerDeselection", {
        bouncerId: selectedBouncer._id,
        bouncerName: selectedBouncer.name,
        price: selectedBouncer.extractedPrice || 0,
        currentSelectionCount: state.selectedBouncers.length,
      });

      // Always allow deselection
      dispatch({ type: "REMOVE_BOUNCER", payload: bouncerId });
    } else {
      // Only prevent addition if we're at the limit
      if (state.selectedBouncers.length >= 3) {
        // Track limit reached event
        trackFieldChange("bouncerSelectionLimitReached", {
          attemptedBouncerId: selectedBouncer._id,
          attemptedBouncerName: selectedBouncer.name,
          currentSelectionCount: state.selectedBouncers.length,
        });

        // Show user feedback instead of silent failure
        alert(
          "You can select up to 3 bounce houses maximum. Please deselect one first if you want to choose a different one.",
        );
        return;
      }

      // Track selection
      trackFieldChange("bouncerSelection", {
        bouncerId: selectedBouncer._id,
        bouncerName: selectedBouncer.name,
        price: selectedBouncer.extractedPrice || 0,
        type: getBouncerType(selectedBouncer),
        currentSelectionCount: state.selectedBouncers.length,
        newSelectionCount: state.selectedBouncers.length + 1,
      });

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
    }

    // Calculate discounts
    dispatch({ type: "CALCULATE_BOUNCER_DISCOUNTS" });
  };

  // Get bouncer type for display
  const getBouncerType = (bouncer: Bouncer) => {
    const typeSpec = bouncer.specifications.find(
      (spec) => spec.name === "Type",
    );
    if (Array.isArray(typeSpec?.value)) {
      return typeSpec.value.join("/");
    }
    return typeSpec?.value || "BOUNCER";
  };

  // Get discount badge text
  const getDiscountBadge = (bouncerId: string) => {
    const selectedIndex = state.selectedBouncers.findIndex(
      (b) => b.id === bouncerId,
    );
    if (selectedIndex === -1) return undefined;

    if (selectedIndex === 0) return "Full Price";
    return "50% Off";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Choose Your Bounce House
        </h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Choose Your Bounce House
        </h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{loadError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-purple text-white rounded-lg hover:bg-primary-purple/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Choose Your Bounce House
        </h2>
        <p className="text-gray-600">
          Select up to 3 bounce houses. Additional bounce houses get 50% off!
        </p>
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTypeFilter("ALL");
                    trackFieldChange("typeFilter", "ALL");
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    typeFilter === "ALL"
                      ? "bg-primary-purple text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setTypeFilter("WET");
                    trackFieldChange("typeFilter", "WET");
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    typeFilter === "WET"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  💦 Wet
                </button>
                <button
                  onClick={() => {
                    setTypeFilter("DRY");
                    trackFieldChange("typeFilter", "DRY");
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    typeFilter === "DRY"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  🏰 Dry
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  const newSortBy = e.target.value as
                    | "price-low"
                    | "price-high"
                    | "name";
                  setSortBy(newSortBy);
                  trackFieldChange("sortBy", newSortBy);
                }}
                onFocus={() => trackFieldFocus("sortBy")}
                onBlur={() => trackFieldBlur("sortBy", sortBy)}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-purple"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredBouncers.length} bounce house
            {filteredBouncers.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Selected Count */}
      {state.selectedBouncers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">
              {state.selectedBouncers.length} bounce house
              {state.selectedBouncers.length > 1 ? "s" : ""} selected
            </span>
            <span className="text-sm text-green-600">
              {state.selectedBouncers.length < 3
                ? `Add ${3 - state.selectedBouncers.length} more for extra discounts!`
                : "Maximum reached"}
            </span>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBouncers.map((bouncer) => (
          <ProductCard
            key={bouncer._id}
            id={bouncer._id}
            name={bouncer.name}
            price={bouncer.extractedPrice || 0}
            image={bouncer.images[0]?.url}
            type={getBouncerType(bouncer)}
            available={isProductAvailable(bouncer)}
            unavailabilityReason={getUnavailabilityReason(bouncer)}
            isSelected={state.selectedBouncers.some(
              (b) => b.id === bouncer._id,
            )}
            onSelect={handleBouncerSelect}
            discountBadge={getDiscountBadge(bouncer._id)}
            showAvailability={state.availabilityChecks.status === "success"}
          />
        ))}
      </div>

      {/* Multi-bouncer Discount Explanation */}
      {state.selectedBouncers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">
            💰 Multi-Bounce House Discount
          </h3>
          <p className="text-sm text-blue-700">
            The most expensive bounce house is charged at full price. Additional
            bounce houses get 50% off, regardless of selection order. You can
            select up to 3 total.
          </p>
        </div>
      )}

      {/* Validation Error */}
      {state.errors.selectedBouncer && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{state.errors.selectedBouncer}</p>
        </div>
      )}

      {/* Date Selection Hint */}
      {state.selectedBouncers.length > 0 && !state.deliveryDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Next:</strong> You'll select your delivery date and time
            on the next step.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step1_BouncerSelection;
