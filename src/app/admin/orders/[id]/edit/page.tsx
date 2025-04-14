"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrderById, updateOrder } from "@/utils/api";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order";

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
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditOrder({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [formData, setFormData] = useState<OrderFormData>({
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    deliveryFee: 20,
    processingFee: 0,
    totalAmount: 0,
    depositAmount: 0,
    balanceDue: 0,
    status: "Pending",
    paymentStatus: "Pending",
    paymentMethod: "paypal",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<string>("bouncer");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(0);

  // Get the NextAuth session
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Only fetch order if authenticated
    if (status !== "authenticated") return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);

        // Use the getOrderById function from the API client
        const order = await getOrderById(resolvedParams.id);

        setFormData({
          contactId: order.contactId,
          customerName: order.customerName || "",
          customerEmail: order.customerEmail || "",
          customerPhone: order.customerPhone || "",
          customerAddress: order.customerAddress || "",
          customerCity: order.customerCity || "",
          customerState: order.customerState || "",
          customerZipCode: order.customerZipCode || "",
          items: order.items || [],
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          discountAmount: order.discountAmount,
          deliveryFee: order.deliveryFee,
          processingFee: order.processingFee,
          totalAmount: order.totalAmount,
          depositAmount: order.depositAmount,
          balanceDue: order.balanceDue,
          status: order.status as OrderStatus,
          paymentStatus: order.paymentStatus as PaymentStatus,
          paymentMethod: order.paymentMethod as PaymentMethod,
          notes: order.notes || "",
          tasks: order.tasks || [],
        });
      } catch (error) {
        // Handle authentication errors
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Authentication failed"))
        ) {
          console.error("Authentication error in fetchOrder:", error);
          // Redirect to login page
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [resolvedParams.id, router, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    // Check if authenticated
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    e.preventDefault();

    try {
      setIsLoading(true);

      // Use the updateOrder function from the API client
      await updateOrder(resolvedParams.id, formData);

      // Navigate back to orders list
      router.push("/admin/orders");
      router.refresh();
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to update order",
      );
      console.error("Error updating order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
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
  };

  const handleAddItem = () => {
    if (!newItemName || newItemUnitPrice <= 0 || newItemQuantity <= 0) {
      setError("Please fill in all item fields with valid values");
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

    setFormData((prev) => {
      const updatedItems = [...prev.items, newItem];
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );
      const processingFee = Math.round(subtotal * 0.03 * 100) / 100;
      const totalAmount = Math.round(
        (subtotal +
          prev.taxAmount +
          prev.deliveryFee +
          processingFee -
          prev.discountAmount) *
          100,
      ) / 100;
      const balanceDue = Math.round(
        (totalAmount - prev.depositAmount) * 100,
      ) / 100;

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        processingFee,
        totalAmount,
        balanceDue,
      };
    });

    // Reset new item fields
    setNewItemType("bouncer");
    setNewItemName("");
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemUnitPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );
      const processingFee = Math.round(subtotal * 0.03 * 100) / 100;
      const totalAmount = Math.round(
        (subtotal +
          prev.taxAmount +
          prev.deliveryFee +
          processingFee -
          prev.discountAmount) *
          100,
      ) / 100;
      const balanceDue = Math.round(
        (totalAmount - prev.depositAmount) * 100,
      ) / 100;

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        processingFee,
        totalAmount,
        balanceDue,
      };
    });
  };

  const handleUpdatePricing = () => {
    setFormData((prev) => {
      const subtotal = prev.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );
      const processingFee = Math.round(subtotal * 0.03 * 100) / 100;
      const totalAmount = Math.round(
        (subtotal +
          prev.taxAmount +
          prev.deliveryFee +
          processingFee -
          prev.discountAmount) *
          100,
      ) / 100;
      const balanceDue = Math.round(
        (totalAmount - prev.depositAmount) * 100,
      ) / 100;

      return {
        ...prev,
        subtotal,
        processingFee,
        totalAmount,
        balanceDue,
      };
    });
  };

  const handleAddTask = () => {
    const taskInput = document.getElementById("new-task") as HTMLInputElement;
    const taskValue = taskInput.value.trim();
    
    if (!taskValue) return;
    
    setFormData(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), taskValue]
    }));
    
    taskInput.value = "";
  };

  const handleRemoveTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks?.filter((_, i) => i !== index)
    }));
  };

  // Show loading spinner when session is loading or when fetching order
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Order</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
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
                  <option value="Partially Refunded">Partially Refunded</option>
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
                Contact ID
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

        {/* Order Items */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Order Items</h2>
          
          {/* Existing Items */}
          {formData.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Current Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.name}
                          {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${item.totalPrice.toFixed(2)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Add New Item */}
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Add New Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
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
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
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
                    onChange={(e) => setNewItemUnitPrice(parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Pricing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subtotal
                <input
                  type="number"
                  name="subtotal"
                  value={formData.subtotal}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tax Amount
                <input
                  type="number"
                  name="taxAmount"
                  value={formData.taxAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Amount
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery Fee
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Processing Fee (3% of subtotal)
                <input
                  type="number"
                  name="processingFee"
                  value={formData.processingFee}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Amount
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Deposit Amount
                <input
                  type="number"
                  name="depositAmount"
                  value={formData.depositAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Balance Due
                <input
                  type="number"
                  name="balanceDue"
                  value={formData.balanceDue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
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
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{task}</span>
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
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
