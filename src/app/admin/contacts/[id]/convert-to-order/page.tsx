"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getContactById, createOrderFromContact } from "@/utils/api";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order";
import { Contact } from "@/types/contact";
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
import { useProductCache } from "@/hooks/useProductCache";
import {
  formatDateCT,
  parseDateCT,
  formatDisplayDateCT,
  parseAndFormatPartyDateCT,
  parsePartyDateCT,
} from "@/utils/dateUtils";

interface OrderItem {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderFormData {
  contactId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  partyDate?: string;
  partyZipCode?: string;
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
  tasks?: string[];
  sourcePage: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ConvertContactToOrder({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { status } = useSession();
  const [contact, setContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    contactId: "",
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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Initialize product cache hook for price lookup
  const { products } = useProductCache();

  // Function to look up product price by name
  const lookupProductPrice = useCallback(
    (productName: string): number => {
      if (!products || products.length === 0) {
        return 0; // Return 0 if products haven't loaded yet
      }

      // Try exact match first
      const exactMatch = products.find(
        (product) => product.name.toLowerCase() === productName.toLowerCase(),
      );
      if (exactMatch) {
        return exactMatch.price.base;
      }

      // Try partial match (product name contains the search term or vice versa)
      const partialMatch = products.find(
        (product) =>
          product.name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(product.name.toLowerCase()),
      );
      if (partialMatch) {
        return partialMatch.price.base;
      }

      // No match found
      return 0;
    },
    [products],
  );

  // Initialize pricing hook
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check for missing required fields
  const validateRequiredFields = useCallback(() => {
    const missing: string[] = [];

    // Check if contact has required fields
    if (contact) {
      if (!contact.streetAddress) missing.push("Street Address");
      if (!contact.partyStartTime) missing.push("Party Start Time");
    }

    setMissingFields(missing);
    return missing.length === 0;
  }, [contact]);

  // Fetch contact and initialize form data
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchContact = async () => {
      try {
        setIsLoading(true);

        const contactData = await getContactById(resolvedParams.id);

        // Check if contact is already converted
        if (contactData.confirmed === "Converted") {
          setError("This contact has already been converted to an order");
          setContact(contactData);
          return;
        }

        setContact(contactData);

        // Initialize form data with contact information
        const initialItems: OrderItem[] = [];

        // Add bouncer as an item if it exists
        if (contactData.bouncer) {
          const bouncerPrice = lookupProductPrice(contactData.bouncer);
          initialItems.push({
            type: "bouncer",
            name: contactData.bouncer,
            quantity: 1,
            unitPrice: bouncerPrice,
            totalPrice: bouncerPrice * 1,
          });
        }

        // Add extras as items if they exist
        const extras = [
          { field: "tablesChairs", name: "Tables & Chairs" },
          { field: "generator", name: "Generator" },
          { field: "popcornMachine", name: "Popcorn Machine" },
          { field: "cottonCandyMachine", name: "Cotton Candy Machine" },
          { field: "snowConeMachine", name: "Snow Cone Machine" },
          { field: "basketballShoot", name: "Basketball Shoot" },
          { field: "slushyMachine", name: "Slushy Machine" },
          { field: "overnight", name: "Overnight Rental" },
        ];

        extras.forEach((extra) => {
          if (contactData[extra.field as keyof Contact]) {
            initialItems.push({
              type: "extra",
              name: extra.name,
              quantity: 1,
              unitPrice: 0, // Admin will need to set the price
              totalPrice: 0,
            });
          }
        });

        setFormData((prev) => ({
          ...prev,
          contactId: resolvedParams.id,
          customerName: contactData.customerName || "",
          customerEmail: contactData.email || "",
          customerPhone: contactData.phone || "",
          partyDate: (() => {
            const parsedDate = parsePartyDateCT(contactData.partyDate);
            return parsedDate ? formatDateCT(parsedDate) : "";
          })(),
          partyZipCode: contactData.partyZipCode || "",
          items: initialItems,
          notes: contactData.message || "",
        }));
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Authentication failed"))
        ) {
          console.error("Authentication error in fetchContact:", error);
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching contact:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [resolvedParams.id, router, status, lookupProductPrice]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : type === "number"
              ? parseFloat(value)
              : value,
      }));
    },
    [],
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

  const handleAddTask = useCallback(() => {
    const taskInput = document.getElementById("new-task") as HTMLInputElement;
    const taskValue = taskInput.value.trim();

    if (!taskValue) return;

    setFormData((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), taskValue],
    }));

    taskInput.value = "";
  }, []);

  const handleRemoveTask = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks?.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      // Reset error and success messages
      setError(null);
      setSuccess(null);

      // Check if contact has required fields
      const isValid = validateRequiredFields();
      if (!isValid) {
        setError(
          `Contact is missing required fields: ${missingFields.join(", ")}. Please update the contact with this information before converting to an order.`,
        );
        return;
      }

      // Validate form data
      if (formData.items.length === 0) {
        setError("Order must contain at least one item");
        return;
      }

      // Check if all items have prices
      const invalidItems = formData.items.filter(
        (item) => item.unitPrice <= 0 || item.totalPrice <= 0,
      );
      if (invalidItems.length > 0) {
        setError("All items must have valid prices");
        return;
      }

      try {
        setIsLoading(true);

        const order = await createOrderFromContact(resolvedParams.id, formData);

        setSuccess(
          `Order created successfully! Order number: ${order.orderNumber}`,
        );

        // Wait a moment before redirecting
        setTimeout(() => {
          router.push("/admin/orders");
          router.refresh();
        }, 2000);
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
    [
      status,
      formData,
      router,
      validateRequiredFields,
      missingFields,
      resolvedParams.id,
    ],
  );

  // Show loading spinner when session is loading or when fetching contact
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
          <h1 className="text-2xl font-semibold mb-6">
            Convert Contact to Order
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
              {success}
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

          {missingFields.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
              <p className="font-medium">Contact is missing required fields:</p>
              <ul className="list-disc list-inside mt-2">
                {missingFields.map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
              <p className="mt-2">
                Please update the contact with this information before
                converting to an order.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium mb-4">Contact Information</h2>
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
                    Party Date
                    <input
                      type="date"
                      name="partyDate"
                      value={formData.partyDate || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Party Zip Code
                    <input
                      type="text"
                      name="partyZipCode"
                      value={formData.partyZipCode || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
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

                {/* Tasks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks
                  </label>

                  {/* Existing Tasks */}
                  {formData.tasks && formData.tasks.length > 0 && (
                    <ul className="mb-4 space-y-2">
                      {formData.tasks.map((task, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm text-gray-700">{task}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(index)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add New Task */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="new-task"
                      placeholder="Enter a new task"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Task
                    </button>
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
                  "Convert to Order"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar with Summary */}
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

            {contact && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Contact Info</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>{contact.email}</div>
                  <div>{contact.phone || "No phone"}</div>
                  <div>{parseAndFormatPartyDateCT(contact.partyDate)}</div>
                  <div>{contact.partyZipCode}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
