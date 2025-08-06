"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createOrder } from "@/utils/api";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order";
import {
  DEFAULT_DELIVERY_FEE,
  DEFAULT_DISCOUNT_AMOUNT,
  DEFAULT_DEPOSIT_AMOUNT,
  DEFAULT_ORDER_STATUS,
  DEFAULT_PAYMENT_STATUS,
  DEFAULT_PAYMENT_METHOD,
} from "@/config/orderConstants";
import { OrderProductSelector } from "@/components/admin/orders/OrderProductSelector";
import { OrderItemsTable } from "@/components/admin/orders/OrderItemsTable";
import { PricingSection } from "@/components/admin/orders/PricingSection";
import { useOrderPricing } from "@/hooks/useOrderPricing";

interface OrderItem {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderFormData {
  contactId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZipCode?: string;
  deliveryDate?: string;
  eventDate?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  processingFee: number;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  sourcePage: string;
}

export default function NewOrder() {
  const router = useRouter();
  const { status } = useSession();
  const [formData, setFormData] = useState<OrderFormData>({
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: DEFAULT_DISCOUNT_AMOUNT,
    deliveryFee: DEFAULT_DELIVERY_FEE,
    processingFee: 0,
    totalAmount: 0,
    depositAmount: DEFAULT_DEPOSIT_AMOUNT,
    balanceDue: 0,
    status: DEFAULT_ORDER_STATUS,
    paymentStatus: DEFAULT_PAYMENT_STATUS,
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    sourcePage: "admin",
    customerState: "Texas",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize hooks
  const { pricing, validatePricing } = useOrderPricing(
    formData.items,
    formData.deliveryFee,
    formData.discountAmount,
    formData.depositAmount,
  );

  // Get validation warnings
  const validationWarnings = useMemo(() => {
    return validatePricing();
  }, [validatePricing]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Update form data with calculated pricing
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      subtotal: pricing.subtotal,
      taxAmount: pricing.taxAmount,
      processingFee: pricing.processingFee,
      totalAmount: pricing.totalAmount,
      balanceDue: pricing.balanceDue,
    }));
  }, [pricing]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Auto-populate delivery date with event date if not set
      if (name === "eventDate" && value && !formData.deliveryDate) {
        setFormData((prev) => ({
          ...prev,
          deliveryDate: value,
        }));
      }
    },
    [formData.deliveryDate],
  );

  const handleAddItem = useCallback((item: OrderItem) => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const handleDeliveryFeeChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, deliveryFee: value }));
  }, []);

  const handleDiscountAmountChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, discountAmount: value }));
  }, []);

  const handleDepositAmountChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, depositAmount: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      // Validate form data
      if (formData.items.length === 0) {
        setError("Order must contain at least one item");
        return;
      }

      if (!formData.contactId && !formData.customerEmail) {
        setError("Either Contact ID or Customer Email must be provided");
        return;
      }

      if (!formData.eventDate) {
        setError("Event date is required");
        return;
      }

      // Validate delivery date isn't after event date
      if (formData.deliveryDate && formData.eventDate) {
        const deliveryDate = new Date(formData.deliveryDate);
        const eventDate = new Date(formData.eventDate);
        if (deliveryDate > eventDate) {
          setError("Delivery date cannot be after the event date");
          return;
        }
      }

      try {
        setIsLoading(true);
        setError(null);

        // Prepare the order data with proper date formatting
        const orderData = {
          ...formData,
          deliveryDate: formData.deliveryDate
            ? new Date(formData.deliveryDate).toISOString()
            : undefined,
          eventDate: formData.eventDate
            ? new Date(formData.eventDate).toISOString()
            : undefined,
        };

        const newOrder = await createOrder(orderData);

        // Redirect to the newly created order's detail page
        router.push(`/admin/orders/${newOrder._id}`);
        router.refresh();
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          router.push("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to create order",
        );
        console.error("Error creating order:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [status, formData, router],
  );

  // Show loading spinner when session is loading or when creating order
  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (status !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please log in to access this page...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3">
          <h1 className="text-2xl font-semibold mb-6">Create New Order</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Order Warnings:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium mb-4">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Order Status
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Paid">Paid</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Status
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Authorized">Authorized</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Partially Refunded">
                        Partially Refunded
                      </option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="paypal">PayPal</option>
                      <option value="cash">Cash</option>
                      <option value="quickbooks">QuickBooks</option>
                      <option value="free">Free</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact ID (Optional)
                    <input
                      type="text"
                      name="contactId"
                      value={formData.contactId || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Name
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Email
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Phone
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Address
                    <input
                      type="text"
                      name="customerAddress"
                      value={formData.customerAddress || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer City
                    <input
                      type="text"
                      name="customerCity"
                      value={formData.customerCity || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer State
                    <input
                      type="text"
                      name="customerState"
                      value={formData.customerState || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Zip Code
                    <input
                      type="text"
                      name="customerZipCode"
                      value={formData.customerZipCode || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Event & Delivery Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium mb-4">
                Event & Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Event Date *
                    <input
                      type="datetime-local"
                      name="eventDate"
                      value={formData.eventDate || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    The date and time of the actual party/event
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Date
                    <input
                      type="datetime-local"
                      name="deliveryDate"
                      value={formData.deliveryDate || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    When to deliver the items (auto-populated with event date)
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <OrderProductSelector onAddItem={handleAddItem} />
            <OrderItemsTable
              items={formData.items}
              onRemoveItem={handleRemoveItem}
            />

            {/* Pricing Information */}
            <PricingSection
              items={formData.items}
              deliveryFee={formData.deliveryFee}
              discountAmount={formData.discountAmount}
              depositAmount={formData.depositAmount}
              onDeliveryFeeChange={handleDeliveryFeeChange}
              onDiscountAmountChange={handleDiscountAmountChange}
              onDepositAmountChange={handleDepositAmountChange}
            />

            {/* Additional Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium mb-4">
                Additional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                    <textarea
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>

                {/* Task Creation Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Task Management</p>
                      <p className="mt-1">
                        Tasks can be created after the order is saved. You'll be
                        able to create and manage tasks from the order detail
                        page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <LoadingSpinner className="w-5 h-5" />
                ) : (
                  "Create Order"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar with Progress */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-md font-medium mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{formData.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${pricing.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${pricing.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Balance Due:</span>
                <span>${pricing.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
