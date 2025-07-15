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
import { OrderItem, OrderItemType } from "@/types/order";

interface OrderProductSelectorProps {
  onAddItem: (item: OrderItem) => void;
  className?: string;
}

export const OrderProductSelector: React.FC<OrderProductSelectorProps> = ({
  onAddItem,
  className = "",
}) => {
  const { products, isLoading, error } = useProductCache();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(
    null,
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Form state for new item
  const [newItemType, setNewItemType] = useState<OrderItemType>("bouncer");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Category to type mapping for products
  const categoryToTypeMapping: Record<string, OrderItemType> = {
    "bounce-house": "bouncer",
    bouncer: "bouncer",
    "water-slide": "bouncer",
    combo: "bouncer",
    inflatable: "bouncer",
    table: "extra",
    chair: "extra",
    generator: "extra",
    concession: "extra",
    "add-on": "add-on",
    addon: "add-on",
    extra: "extra",
  };

  // Helper function to get product type from category
  const getProductType = useCallback(
    (category: string): OrderItemType => {
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, "-");
      return categoryToTypeMapping[normalizedCategory] || "bouncer";
    },
    [categoryToTypeMapping],
  );

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm || showCustomItem) return products.slice(0, 10);

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
  }, [products, debouncedSearchTerm, showCustomItem]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleProductSelect = useCallback(
    (product: ProductWithId) => {
      setSelectedProduct(product);
      setNewItemName(product.name);
      setNewItemUnitPrice(product.price.base);
      setNewItemType(getProductType(product.category));
      setNewItemDescription(""); // Keep description empty for admin to add custom notes
      setSearchTerm(product.name);
      setShowDropdown(false);
      setFocusedIndex(-1);
    },
    [getProductType],
  );

  const handleCustomItemToggle = useCallback(() => {
    const newShowCustom = !showCustomItem;
    setShowCustomItem(newShowCustom);

    if (newShowCustom) {
      // Switching to custom item mode
      setSelectedProduct(null);
      setNewItemName("");
      setNewItemUnitPrice(0);
      setNewItemType("bouncer");
      setNewItemDescription("");
      setSearchTerm("");
    } else {
      // Switching back to product selection mode
      setSearchTerm("");
    }

    setShowDropdown(false);
    setFocusedIndex(-1);
  }, [showCustomItem]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);

      if (!showCustomItem) {
        setShowDropdown(true);
        setFocusedIndex(-1);
      }
    },
    [showCustomItem],
  );

  const handleInputFocus = useCallback(() => {
    if (!showCustomItem) {
      setShowDropdown(true);
    }
  }, [showCustomItem]);

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
      if (showCustomItem || !showDropdown) return;

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
      showCustomItem,
      showDropdown,
      filteredProducts,
      focusedIndex,
      handleProductSelect,
    ],
  );

  // Handle adding item to order
  const handleAddItem = useCallback(() => {
    if (!newItemName || newItemUnitPrice <= 0 || newItemQuantity <= 0) {
      return;
    }

    const newItem: OrderItem = {
      type: newItemType,
      name: newItemName,
      description: newItemDescription || undefined,
      quantity: newItemQuantity,
      unitPrice: newItemUnitPrice,
      totalPrice: newItemQuantity * newItemUnitPrice,
    };

    onAddItem(newItem);

    // Reset form
    setSelectedProduct(null);
    setSearchTerm("");
    setShowDropdown(false);
    setNewItemType("bouncer");
    setNewItemName("");
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemUnitPrice(0);
  }, [
    newItemName,
    newItemUnitPrice,
    newItemQuantity,
    newItemType,
    newItemDescription,
    onAddItem,
  ]);

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
        <h3 className="text-md font-medium">Add New Item</h3>
        <button
          type="button"
          onClick={handleCustomItemToggle}
          className={`px-3 py-1 text-sm rounded-md border transition-colors ${
            showCustomItem
              ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }`}
        >
          {showCustomItem ? "Use Product Catalog" : "Use Custom Item"}
        </button>
      </div>

      {!showCustomItem ? (
        /* Product Selection Mode */
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-3 top-9">
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
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
              <div className="text-sm text-gray-500">
                No products found. Try a different search term or use custom
                item.
              </div>
            )}

          {/* Error message */}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {/* Quantity and Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
                <select
                  value={newItemType}
                  onChange={(e) =>
                    setNewItemType(e.target.value as OrderItemType)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={!!selectedProduct}
                >
                  <option value="bouncer">Bouncer</option>
                  <option value="extra">Extra</option>
                  <option value="add-on">Add-on</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
                <input
                  type="number"
                  min="1"
                  value={newItemQuantity}
                  onChange={(e) =>
                    setNewItemQuantity(parseInt(e.target.value) || 1)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItemUnitPrice}
                  onChange={(e) =>
                    setNewItemUnitPrice(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={!!selectedProduct}
                />
              </label>
            </div>
          </div>

          {/* Additional Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Description (Optional)
              <input
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Add any custom notes or modifications..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedProduct || newItemQuantity <= 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Product to Order
            </button>
          </div>
        </div>
      ) : (
        /* Custom Item Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
              <select
                value={newItemType}
                onChange={(e) =>
                  setNewItemType(e.target.value as OrderItemType)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="bouncer">Bouncer</option>
                <option value="extra">Extra</option>
                <option value="add-on">Add-on</option>
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description (Optional)
              <input
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
              <input
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={(e) =>
                  setNewItemQuantity(parseInt(e.target.value) || 1)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItemUnitPrice}
                onChange={(e) =>
                  setNewItemUnitPrice(parseFloat(e.target.value) || 0)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={
                !newItemName || newItemUnitPrice <= 0 || newItemQuantity <= 0
              }
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Custom Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
