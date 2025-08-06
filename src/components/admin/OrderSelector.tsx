import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { getEventDateDisplay } from "@/utils/dateUtils";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fullAddress: string;
  eventDate: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  displayText: string;
  displaySubtext: string;
}

interface OrderSelectorProps {
  selectedOrderId?: string;
  onOrderSelect: (order: Order | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export default function OrderSelector({
  selectedOrderId,
  onOrderSelect,
  placeholder = "Search orders by number, customer name, or address...",
  disabled = false,
  error,
}: OrderSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSelectingOrder, setIsSelectingOrder] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search orders when search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2 && !isSelectingOrder) {
      searchOrders(debouncedSearchTerm);
    } else {
      setOrders([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm, isSelectingOrder]);

  // Load selected order if selectedOrderId is provided
  useEffect(() => {
    if (selectedOrderId && !selectedOrder) {
      loadSelectedOrder(selectedOrderId);
    }
  }, [selectedOrderId, selectedOrder]);

  const searchOrders = async (query: string) => {
    try {
      setLoading(true);
      setSearchError(null);

      const response = await fetch(
        `/api/v1/orders/search?q=${encodeURIComponent(query)}&limit=20`,
      );

      if (!response.ok) {
        throw new Error("Failed to search orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setIsOpen(true);
    } catch (err) {
      console.error("Error searching orders:", err);
      setSearchError("Failed to search orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedOrder = async (orderId: string) => {
    try {
      setIsSelectingOrder(true);
      const response = await fetch(`/api/v1/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to load order");
      }

      const order = await response.json();
      const formattedOrder: Order = {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        fullAddress: [
          order.customerAddress,
          order.customerCity,
          order.customerState,
          order.customerZipCode,
        ]
          .filter(Boolean)
          .join(", "),
        eventDate: order.eventDate,
        deliveryDate: order.deliveryDate,
        status: order.status,
        totalAmount: order.totalAmount,
        displayText: `${order.orderNumber} - ${order.customerName || "No Name"}`,
        displaySubtext: `${[
          order.customerAddress,
          order.customerCity,
          order.customerState,
          order.customerZipCode,
        ]
          .filter(Boolean)
          .join(
            ", ",
          )} • ${getEventDateDisplay(order)} • $${order.totalAmount || 0}`,
      };

      setSelectedOrder(formattedOrder);
      setSearchTerm(formattedOrder.displayText);

      // Reset the flag after a brief delay
      setTimeout(() => {
        setIsSelectingOrder(false);
      }, 100);
    } catch (err) {
      console.error("Error loading selected order:", err);
      setIsSelectingOrder(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setIsSelectingOrder(true);
    setSelectedOrder(order);
    setSearchTerm(order.displayText);
    setOrders([]);
    setIsOpen(false);
    onOrderSelect(order);

    // Reset the flag after a brief delay to allow for future searches
    setTimeout(() => {
      setIsSelectingOrder(false);
    }, 100);
  };

  const handleClearSelection = () => {
    setSelectedOrder(null);
    setSearchTerm("");
    setOrders([]);
    setIsOpen(false);
    onOrderSelect(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Reset the selecting flag when user starts typing
    setIsSelectingOrder(false);

    // If user clears the input, clear the selection
    if (!value.trim()) {
      setSelectedOrder(null);
      onOrderSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (orders.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full border rounded-md px-3 py-2 pr-10 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Clear button */}
        {selectedOrder && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {(error || searchError) && (
        <p className="mt-1 text-sm text-red-600">{error || searchError}</p>
      )}

      {/* Dropdown */}
      {isOpen && orders.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {orders.map((order) => (
            <button
              key={order._id}
              type="button"
              onClick={() => handleOrderSelect(order)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.displayText}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {order.displaySubtext}
                  </p>
                </div>
                <span
                  className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : order.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen &&
        orders.length === 0 &&
        debouncedSearchTerm.trim().length >= 2 &&
        !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="px-4 py-3 text-sm text-gray-500">
              No orders found for "{debouncedSearchTerm}"
            </div>
          </div>
        )}

      {/* Selected order details */}
      {selectedOrder && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Selected Order: {selectedOrder.orderNumber}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Customer: {selectedOrder.customerName}
              </p>
              <p className="text-xs text-blue-700">
                Address: {selectedOrder.fullAddress}
              </p>
              <p className="text-xs text-blue-700">
                Event Date: {getEventDateDisplay(selectedOrder)}
              </p>
            </div>
            <span
              className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                selectedOrder.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : selectedOrder.status === "In Progress"
                    ? "bg-blue-100 text-blue-800"
                    : selectedOrder.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {selectedOrder.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
