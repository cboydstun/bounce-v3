import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { ProductWithId } from "@/types/product";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useDebounce } from "@/hooks/useDebounce";
import { useProductCache } from "@/hooks/useProductCache";

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: ProductWithId | null) => void;
  className?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  onProductSelect,
  className = "",
}) => {
  const { products, isLoading, error } = useProductCache();
  const [searchTerm, setSearchTerm] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomBouncer, setShowCustomBouncer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(
    null,
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm || showCustomBouncer) return products.slice(0, 10);

    return products
      .filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          product.category
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()),
      )
      .slice(0, 10); // Limit results for performance
  }, [products, debouncedSearchTerm, showCustomBouncer]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleProductSelect = useCallback(
    (product: ProductWithId) => {
      setSelectedProduct(product);
      setSearchTerm(product.name);
      onChange(product.name);
      setShowDropdown(false);
      setFocusedIndex(-1);
      onProductSelect?.(product);
    },
    [onChange, onProductSelect],
  );

  const handleCustomBouncerToggle = useCallback(() => {
    const newShowCustom = !showCustomBouncer;
    setShowCustomBouncer(newShowCustom);

    if (newShowCustom) {
      // Switching to custom bouncer mode
      setSelectedProduct(null);
      setSearchTerm("");
      onChange("");
      onProductSelect?.(null);
    } else {
      // Switching back to product selection mode
      setSearchTerm(value);
    }

    setShowDropdown(false);
    setFocusedIndex(-1);
  }, [showCustomBouncer, onChange, onProductSelect, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);

      if (showCustomBouncer) {
        onChange(newValue);
      } else {
        setShowDropdown(true);
        setFocusedIndex(-1);
      }
    },
    [onChange, showCustomBouncer],
  );

  const handleInputFocus = useCallback(() => {
    if (!showCustomBouncer) {
      setShowDropdown(true);
    }
  }, [showCustomBouncer]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }, 200);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showCustomBouncer || !showDropdown) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredProducts.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredProducts.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && filteredProducts[focusedIndex]) {
            handleProductSelect(filteredProducts[focusedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowDropdown(false);
          setFocusedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [
      showCustomBouncer,
      showDropdown,
      filteredProducts,
      focusedIndex,
      handleProductSelect,
    ],
  );

  // Update search term when value prop changes
  useEffect(() => {
    if (value !== searchTerm && !showDropdown) {
      setSearchTerm(value);
    }
  }, [value, searchTerm, showDropdown]);

  // Auto-focus management for keyboard navigation
  useEffect(() => {
    if (showDropdown && focusedIndex >= 0 && dropdownRef.current) {
      const focusedElement = dropdownRef.current.children[
        focusedIndex
      ] as HTMLElement;
      focusedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, showDropdown]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Bouncer Selection
        </label>
        <button
          type="button"
          onClick={handleCustomBouncerToggle}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
            showCustomBouncer
              ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }`}
        >
          {showCustomBouncer ? "Use Product Catalog" : "Use Custom Name"}
        </button>
      </div>

      {!showCustomBouncer ? (
        /* Product Selection Mode */
        <div className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search bouncer products..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <LoadingSpinner className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Product Dropdown */}
          {showDropdown && filteredProducts.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {filteredProducts.map((product, index) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === focusedIndex
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {product.category}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="font-semibold text-green-600">
                        ${product.price.base.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.capacity} people
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Product Display */}
          {selectedProduct && !showDropdown && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-blue-900">
                    {selectedProduct.name}
                  </div>
                  <div className="text-sm text-blue-700 capitalize">
                    {selectedProduct.category}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Capacity: {selectedProduct.capacity} people | Dimensions:{" "}
                    {selectedProduct.dimensions.length}' ×{" "}
                    {selectedProduct.dimensions.width}' ×{" "}
                    {selectedProduct.dimensions.height}'
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-700">
                    ${selectedProduct.price.base.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No products found */}
          {debouncedSearchTerm &&
            filteredProducts.length === 0 &&
            !isLoading && (
              <div className="mt-2 text-sm text-gray-500">
                No bouncer products found. Try a different search term or use
                custom name.
              </div>
            )}

          {/* Error message */}
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

          {/* Hidden input for form validation */}
          <input type="hidden" name="bouncer" value={value} required />
        </div>
      ) : (
        /* Custom Bouncer Mode */
        <div>
          <input
            type="text"
            name="bouncer"
            value={value}
            onChange={handleInputChange}
            placeholder="Enter custom bouncer name..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      )}
    </div>
  );
};
