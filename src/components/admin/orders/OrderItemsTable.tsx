import React, { useCallback } from "react";

interface OrderItem {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
  onRemoveItem: (index: number) => void;
  onUpdateItem?: (index: number, updatedItem: OrderItem) => void;
  className?: string;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  className = "",
}) => {
  // Memoized handler to prevent unnecessary re-renders
  const handleRemoveItem = useCallback(
    (index: number) => {
      onRemoveItem(index);
    },
    [onRemoveItem],
  );

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4m-4 0H8m-4 0h4m0 0V9a2 2 0 012-2h2a2 2 0 012 2v4.01"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No items added
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first item to the order.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-md font-medium text-gray-900">
          Order Items ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h3>
        <div className="text-sm text-gray-500">
          Subtotal:{" "}
          <span className="font-medium text-gray-900">
            ${subtotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Item
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Unit Price
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Total
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.type === "bouncer"
                        ? "bg-blue-100 text-blue-800"
                        : item.type === "extra"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </td>
                <td className="px-3 py-4 text-sm text-gray-900">
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className="font-medium">{item.quantity}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className="font-medium">
                    ${item.unitPrice.toFixed(2)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <span className="font-semibold">
                    ${item.totalPrice.toFixed(2)}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex items-center justify-end space-x-2">
                    {onUpdateItem && (
                      <button
                        type="button"
                        onClick={() => {
                          // For now, we'll just show an alert. In a full implementation,
                          // this would open an edit modal or inline editing
                          alert("Edit functionality would be implemented here");
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit item"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Remove item"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={4}
                className="px-3 py-3 text-right text-sm font-medium text-gray-900"
              >
                Subtotal:
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm font-bold text-gray-900">
                ${subtotal.toFixed(2)}
              </td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Total Items: {itemCount}</span>
          <span>•</span>
          <span>Subtotal: ${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all items?")) {
                // Clear all items
                for (let i = items.length - 1; i >= 0; i--) {
                  handleRemoveItem(i);
                }
              }
            }}
            className="text-red-600 hover:text-red-900 transition-colors"
            disabled={items.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
