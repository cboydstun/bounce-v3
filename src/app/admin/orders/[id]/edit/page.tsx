"use client";

import React, { useState, useEffect, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrderById, updateOrder, getContactById } from "@/utils/api";
import { Order, OrderItemType, OrderItem } from "@/types/order";
import { Contact } from "@/types/contact";
import { formatDateCT, CENTRAL_TIMEZONE } from "@/utils/dateUtils";
import { OrderProductSelector } from "@/components/admin/orders/OrderProductSelector";
import { OrderItemsTable } from "@/components/admin/orders/OrderItemsTable";
import { PricingSection } from "@/components/admin/orders/PricingSection";
import { useOrderPricing } from "@/hooks/useOrderPricing";

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditOrderPage({ params }: PageProps) {
  // For future Next.js compatibility, always use React.use() to unwrap params
  // This works in both current Next.js and future versions
  const unwrappedParams = use(params as any) as { id: string };
  const id = unwrappedParams.id;

  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Order>>({});

  // Date form state (for datetime-local inputs)
  const [dateFormData, setDateFormData] = useState<{
    deliveryDate?: string;
    eventDate?: string;
  }>({});

  // New task state
  const [newTask, setNewTask] = useState<string>("");

  // Get the NextAuth session
  const { data: session, status: authStatus } = useSession();

  // Initialize pricing hook
  const { pricing, validatePricing } = useOrderPricing(
    order?.items || [],
    formData.deliveryFee || order?.deliveryFee || 0,
    formData.discountAmount || order?.discountAmount || 0,
    formData.depositAmount || order?.depositAmount || 0,
  );

  // Get validation warnings
  const validationWarnings = useMemo(() => {
    return validatePricing();
  }, [validatePricing]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Fetch order data
  useEffect(() => {
    if (authStatus === "authenticated") {
      const fetchOrderData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const orderData = await getOrderById(id);
          setOrder(orderData);

          // Ensure processing fee is correctly calculated (3% of subtotal)
          const calculatedProcessingFee =
            Math.round(orderData.subtotal * 0.03 * 100) / 100;

          // Update the order data with the calculated processing fee
          const updatedOrderData = {
            ...orderData,
            processingFee: calculatedProcessingFee,
          };

          setOrder(updatedOrderData);
          setFormData(updatedOrderData);

          // If order has a contactId, fetch the contact data
          if (orderData.contactId) {
            try {
              const contactData = await getContactById(orderData.contactId);
              setContact(contactData);
            } catch (contactError) {
              console.error("Error fetching contact:", contactError);
              // Don't set an error for contact fetch failure
            }
          }
        } catch (error) {
          console.error("Error fetching order:", error);
          setError(
            error instanceof Error ? error.message : "Failed to fetch order",
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrderData();
    }
  }, [authStatus, id]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    // Handle date fields separately
    if (name === "eventDate" || name === "deliveryDate") {
      setDateFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // If event date is being set and delivery date is empty, auto-populate delivery date
      if (name === "eventDate" && value && !dateFormData.deliveryDate) {
        setDateFormData((prev) => ({
          ...prev,
          eventDate: value,
          deliveryDate: value, // Auto-populate delivery date with event date
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  // Handle item price/quantity changes
  const handleItemChange = (
    index: number,
    field: "quantity" | "unitPrice",
    value: number,
  ) => {
    if (!order) return;

    const updatedItems = [...order.items];
    updatedItems[index][field] = value;
    updatedItems[index].totalPrice =
      updatedItems[index].quantity * updatedItems[index].unitPrice;

    // Update order with new items
    setOrder({
      ...order,
      items: updatedItems,
    });

    // Update form data with new items
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    // Recalculate totals
    recalculateTotals(updatedItems);
  };

  // Memoized handlers for optimized components
  const handleAddItem = useCallback(
    (item: OrderItem) => {
      if (!order) return;

      const updatedItems = [...order.items, item];

      // Update order with new items
      setOrder({
        ...order,
        items: updatedItems,
      });

      // Update form data with new items
      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    },
    [order],
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      if (!order) return;

      const updatedItems = order.items.filter((_, i) => i !== index);

      // Update order with new items
      setOrder({
        ...order,
        items: updatedItems,
      });

      // Update form data with new items
      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    },
    [order],
  );

  // Memoized pricing handlers
  const handleDeliveryFeeChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, deliveryFee: value }));
  }, []);

  const handleDiscountAmountChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, discountAmount: value }));
  }, []);

  const handleDepositAmountChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, depositAmount: value }));
  }, []);

  // Add new task to order
  const handleAddTask = () => {
    if (!order || !newTask.trim()) return;

    const updatedTasks = [...(order.tasks || []), newTask.trim()];

    // Update order with new tasks
    setOrder({
      ...order,
      tasks: updatedTasks,
    });

    // Update form data with new tasks
    setFormData((prev) => ({
      ...prev,
      tasks: updatedTasks,
    }));

    // Reset new task field
    setNewTask("");
  };

  // Remove task from order
  const handleRemoveTask = (index: number) => {
    if (!order || !order.tasks) return;

    const updatedTasks = order.tasks.filter((_, i) => i !== index);

    // Update order with new tasks
    setOrder({
      ...order,
      tasks: updatedTasks,
    });

    // Update form data with new tasks
    setFormData((prev) => ({
      ...prev,
      tasks: updatedTasks,
    }));
  };

  // Recalculate order totals
  const recalculateTotals = (items: OrderItem[]) => {
    if (!order) return;

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Calculate processing fee (3% of subtotal)
    const processingFee = Math.round(subtotal * 0.03 * 100) / 100;

    // Calculate total amount
    const totalAmount =
      Math.round(
        (subtotal +
          (formData.taxAmount || order.taxAmount || 0) +
          (formData.deliveryFee || order.deliveryFee || 0) +
          processingFee -
          (formData.discountAmount || order.discountAmount || 0)) *
          100,
      ) / 100;

    // Calculate balance due
    const balanceDue =
      Math.round(
        (totalAmount - (formData.depositAmount || order.depositAmount || 0)) *
          100,
      ) / 100;

    // Update form data with new totals
    setFormData((prev) => ({
      ...prev,
      subtotal,
      processingFee,
      totalAmount,
      balanceDue,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare the order data with proper date formatting
      const updateData = {
        ...formData,
        contactId:
          typeof order.contactId === "string" ? order.contactId : undefined,
        // Convert datetime-local strings to ISO Date strings for the API
        deliveryDate: dateFormData.deliveryDate
          ? new Date(dateFormData.deliveryDate).toISOString()
          : formData.deliveryDate || order.deliveryDate,
        eventDate: dateFormData.eventDate
          ? new Date(dateFormData.eventDate).toISOString()
          : formData.eventDate || order.eventDate,
      };

      // Update order
      const updatedOrder = await updateOrder(id, updateData);

      setSuccess("Order updated successfully");

      // Update local order state
      setOrder(updatedOrder);

      // Refresh order data after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error updating order:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update order",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display in Central Time
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      timeZone: CENTRAL_TIMEZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Convert Date to datetime-local string format
  const formatDateTimeLocal = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Convert to local time and format for datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Show loading spinner when session is loading or when fetching order
  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (authStatus !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please log in to access this page...</p>
      </div>
    );
  }

  // If order not found
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          {error || "Order not found"}
        </div>
        <Link
          href="/admin/orders"
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Edit Order: {order.orderNumber}
        </h1>
        <Link
          href="/admin/orders"
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Orders
        </Link>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Error message */}
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

      {/* Contact information (if available) */}
      {contact && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-2">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{contact.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{contact.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Party Date</p>
              <p className="text-sm text-gray-900">
                {formatDate(contact.partyDate)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-sm text-gray-900">
                {contact.streetAddress || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Customer information (if no contact) */}
      {!contact && order.customerEmail && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-2">
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-sm text-gray-900">
                {order.customerName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">
                {order.customerPhone || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-sm text-gray-900">
                {order.customerAddress
                  ? `${order.customerAddress}, ${order.customerCity}, ${order.customerState} ${order.customerZipCode}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Customer Information</h2>
            {contact && !order.customerEmail && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Auto-populated from Contact
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Name
                <input
                  type="text"
                  name="customerName"
                  value={
                    formData.customerName !== undefined
                      ? formData.customerName
                      : order.customerName ||
                        contact?.customerName ||
                        (contact?.email ? contact.email.split("@")[0] : "") ||
                        ""
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Email
                <input
                  type="email"
                  name="customerEmail"
                  value={
                    formData.customerEmail !== undefined
                      ? formData.customerEmail
                      : order.customerEmail || contact?.email || ""
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Phone
                <input
                  type="tel"
                  name="customerPhone"
                  value={
                    formData.customerPhone !== undefined
                      ? formData.customerPhone
                      : order.customerPhone || contact?.phone || ""
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Address
                <input
                  type="text"
                  name="customerAddress"
                  value={
                    formData.customerAddress !== undefined
                      ? formData.customerAddress
                      : order.customerAddress || contact?.streetAddress || ""
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="123 Main Street"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer City
                <input
                  type="text"
                  name="customerCity"
                  value={
                    formData.customerCity !== undefined
                      ? formData.customerCity
                      : order.customerCity || contact?.city || ""
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="San Antonio"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer State
                <input
                  type="text"
                  name="customerState"
                  value={
                    formData.customerState !== undefined
                      ? formData.customerState
                      : order.customerState || contact?.state || "Texas"
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Texas"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Zip Code
                <input
                  type="text"
                  name="customerZipCode"
                  value={
                    formData.customerZipCode !== undefined
                      ? formData.customerZipCode
                      : order.customerZipCode || contact?.partyZipCode || ""
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="78201"
                />
              </label>
            </div>
          </div>
          {contact && !order.customerEmail && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Customer information has been
                auto-populated from the associated contact record. You can
                modify these fields as needed and save the changes to update the
                order permanently.
              </p>
            </div>
          )}
        </div>

        {/* Event & Delivery Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">
            Event & Delivery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Event Date
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={
                    dateFormData.eventDate !== undefined
                      ? dateFormData.eventDate
                      : formatDateTimeLocal(order.eventDate)
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  value={
                    dateFormData.deliveryDate !== undefined
                      ? dateFormData.deliveryDate
                      : formatDateTimeLocal(order.deliveryDate)
                  }
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
              <p className="mt-1 text-sm text-gray-500">
                When to deliver the items (auto-populated from event date if not
                specified)
              </p>
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
                  value={formData.status || order.status}
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
                  value={formData.paymentStatus || order.paymentStatus}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Authorized">Authorized</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Partially Refunded">Partially Refunded</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod || order.paymentMethod}
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
                Order Number
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber || order.orderNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  readOnly
                />
              </label>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <OrderProductSelector onAddItem={handleAddItem} />
        <OrderItemsTable items={order.items} onRemoveItem={handleRemoveItem} />

        {/* Pricing Information */}
        <PricingSection
          items={order.items}
          deliveryFee={formData.deliveryFee || order.deliveryFee || 0}
          discountAmount={formData.discountAmount || order.discountAmount || 0}
          depositAmount={formData.depositAmount || order.depositAmount || 0}
          onDeliveryFeeChange={handleDeliveryFeeChange}
          onDiscountAmountChange={handleDiscountAmountChange}
          onDepositAmountChange={handleDepositAmountChange}
        />

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
                <textarea
                  name="notes"
                  value={
                    formData.notes !== undefined
                      ? formData.notes
                      : order.notes || ""
                  }
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
              <div className="space-y-2">
                {order.tasks && order.tasks.length > 0 ? (
                  order.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900">{task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tasks added</p>
                )}
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add a new task"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? <LoadingSpinner className="w-5 h-5" /> : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
