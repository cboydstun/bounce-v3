import React, { useCallback } from "react";
import { useOrderPricing } from "@/hooks/useOrderPricing";

interface OrderItem {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PricingSectionProps {
  items: OrderItem[];
  deliveryFee: number;
  discountAmount: number;
  depositAmount: number;
  onDeliveryFeeChange: (value: number) => void;
  onDiscountAmountChange: (value: number) => void;
  onDepositAmountChange: (value: number) => void;
  className?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  items,
  deliveryFee,
  discountAmount,
  depositAmount,
  onDeliveryFeeChange,
  onDiscountAmountChange,
  onDepositAmountChange,
  className = "",
}) => {
  const {
    pricing,
    validatePricing,
    suggestDepositAmount,
    formatCurrency,
    getPricingBreakdown,
  } = useOrderPricing(items, deliveryFee, discountAmount, depositAmount);

  const validationWarnings = validatePricing();
  const suggestedDeposit = suggestDepositAmount();
  const pricingBreakdown = getPricingBreakdown();

  // Memoized handlers to prevent unnecessary re-renders
  const handleDeliveryFeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      onDeliveryFeeChange(value);
    },
    [onDeliveryFeeChange],
  );

  const handleDiscountAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      onDiscountAmountChange(value);
    },
    [onDiscountAmountChange],
  );

  const handleDepositAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      onDepositAmountChange(value);
    },
    [onDepositAmountChange],
  );

  const handleSuggestDeposit = useCallback(() => {
    onDepositAmountChange(suggestedDeposit);
  }, [onDepositAmountChange, suggestedDeposit]);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-lg font-medium mb-4">Pricing Information</h2>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Pricing Warnings:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validationWarnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subtotal
              <input
                type="number"
                value={pricing.subtotal}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                readOnly
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Calculated from order items
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Delivery Fee
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={handleDeliveryFeeChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={handleDiscountAmountChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Processing Fee (3% of subtotal)
              <input
                type="number"
                value={pricing.processingFee}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                readOnly
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Automatically calculated
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tax Amount (8.25%)
              <input
                type="number"
                value={pricing.taxAmount}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                readOnly
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Calculated on taxable amount
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Deposit Amount
              </label>
              {suggestedDeposit !== depositAmount && (
                <button
                  type="button"
                  onClick={handleSuggestDeposit}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Suggest: {formatCurrency(suggestedDeposit)}
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={handleDepositAmountChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">
            Pricing Breakdown
          </h3>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              {pricingBreakdown.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center text-sm ${
                    item.type === "total"
                      ? "font-bold text-gray-900 border-t pt-2"
                      : item.type === "balance"
                        ? "font-bold text-blue-900 border-t pt-2"
                        : item.type === "negative"
                          ? "text-red-600"
                          : "text-gray-700"
                  }`}
                >
                  <span>{item.label}:</span>
                  <span>
                    {item.type === "negative" && item.amount < 0 ? "-" : ""}
                    {formatCurrency(Math.abs(item.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(pricing.totalAmount)}
              </div>
              <div className="text-sm text-blue-700">Total Amount</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(pricing.balanceDue)}
              </div>
              <div className="text-sm text-green-700">Balance Due</div>
            </div>
          </div>

          {/* Payment Status Indicator */}
          <div className="mt-4">
            {pricing.balanceDue === 0 ? (
              <div className="flex items-center text-green-600">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Fully Paid</span>
              </div>
            ) : (
              <div className="flex items-center text-yellow-600">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Payment Required: {formatCurrency(pricing.balanceDue)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      <div className="hidden">
        <input type="hidden" name="subtotal" value={pricing.subtotal} />
        <input type="hidden" name="taxAmount" value={pricing.taxAmount} />
        <input
          type="hidden"
          name="processingFee"
          value={pricing.processingFee}
        />
        <input type="hidden" name="totalAmount" value={pricing.totalAmount} />
        <input type="hidden" name="balanceDue" value={pricing.balanceDue} />
      </div>
    </div>
  );
};
