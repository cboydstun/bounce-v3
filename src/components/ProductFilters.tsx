"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown, Filter, X } from "lucide-react";
import type { ProductWithId } from "../types/product";

type FilterType = "ALL" | "DRY" | "WET" | "EXTRA";

interface ProductFiltersProps {
  products: ProductWithId[];
  onFilteredProducts: (products: ProductWithId[]) => void;
}

export function ProductFilters({
  products,
  onFilteredProducts,
}: ProductFiltersProps) {
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedType, setSelectedType] = useState<FilterType>("ALL");
  const [showFilters, setShowFilters] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [minSize, setMinSize] = useState<number>(0);

  const applyFilters = useCallback(() => {
    const filteredAndSortedProducts = [...products]
      .filter((product) => {
        if (selectedType !== "ALL") {
          const typeSpec = product.specifications?.find(
            (spec) => spec.name === "Type"
          );
          if (!typeSpec) return false;
          const typeValue = typeSpec.value;
          if (Array.isArray(typeValue)) {
            if (!typeValue.includes(selectedType)) return false;
          } else if (typeValue !== selectedType) return false;
        }

        if (
          product.price.base < priceRange.min ||
          product.price.base > priceRange.max
        )
          return false;

        if (product.dimensions) {
          const floorArea =
            product.dimensions.length * product.dimensions.width;
          if (floorArea < minSize) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const modifier = sortAscending ? 1 : -1;
        return (a.price.base - b.price.base) * modifier;
      });

    onFilteredProducts(filteredAndSortedProducts);
  }, [
    products,
    selectedType,
    priceRange,
    minSize,
    sortAscending,
    onFilteredProducts,
  ]);

  // Apply filters whenever any filter value changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleSort = () => setSortAscending(!sortAscending);
  const toggleFilters = () => setShowFilters(!showFilters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-primary-blue rounded-xl border-2 border-primary-blue/20 hover:border-primary-blue/40 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
          >
            {showFilters ? <X size={20} /> : <Filter size={20} />}
            Filters
          </button>
          <button
            onClick={toggleSort}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-400 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
          >
            <ArrowUpDown size={20} />
            <span className="hidden md:inline">Price:</span>{" "}
            {sortAscending ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6 border-2 border-secondary-blue/20">
          {/* Type Filter */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <span className="font-semibold text-primary-blue md:min-w-24">
              Type:
            </span>
            <div className="flex flex-wrap gap-2">
              {(["ALL", "DRY", "WET", "EXTRA"] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 font-semibold ${
                    selectedType === type
                      ? "bg-gradient-to-r from-blue-400 to-purple-600 text-white shadow-md"
                      : "bg-secondary-blue/10 hover:bg-secondary-blue/20 text-primary-blue"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <span className="font-semibold text-primary-blue md:min-w-24">
              Price:
            </span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({
                    ...prev,
                    min: Number(e.target.value),
                  }))
                }
                className="px-4 py-2 rounded-lg border-2 border-secondary-blue/20 w-28 text-primary-blue font-medium focus:border-primary-blue focus:outline-none transition-colors duration-300"
                placeholder="Min"
              />
              <span className="text-primary-blue font-medium">to</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({
                    ...prev,
                    max: Number(e.target.value),
                  }))
                }
                className="px-4 py-2 rounded-lg border-2 border-secondary-blue/20 w-28 text-primary-blue font-medium focus:border-primary-blue focus:outline-none transition-colors duration-300"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Minimum Size Filter */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <span className="font-semibold text-primary-blue md:min-w-24">
              Min Size (sq ft):
            </span>
            <input
              type="number"
              value={minSize}
              onChange={(e) => setMinSize(Number(e.target.value))}
              className="px-4 py-2 rounded-lg border-2 border-secondary-blue/20 w-28 text-primary-blue font-medium focus:border-primary-blue focus:outline-none transition-colors duration-300"
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
