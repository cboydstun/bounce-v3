"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrderById, updateOrder, getContactById } from "@/utils/api";
import { Order, OrderStatus, PaymentStatus, PaymentMethod, OrderItemType } from "@/types/order";
import { Contact } from "@/types/contact";

interface OrderItem {
  type: OrderItemType;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditOrderPage({ params }: PageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Order>>({});
  
  // New item state
  const [newItemType, setNewItemType] = useState<OrderItemType>("bouncer");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(0);
  
  // New task state
  const [newTask, setNewTask] = useState<string>("");
  
  // Get the NextAuth session
  const { data: session, status: authStatus } = useSession();

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
          
          const orderData = await getOrderById(params.id);
          setOrder(orderData);
          setFormData(orderData);
          
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
          setError(error instanceof Error ? error.message : "Failed to fetch order");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchOrderData();
    }
  }, [authStatus, params.id]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? parseFloat(value) : value,
    }));
  };

  // Handle item price/quantity changes
  const handleItemChange = (
    index: number,
    field: "quantity" | "unitPrice",
    value: number
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

  // Add new item to order
  const handleAddItem = () => {
    if (!order || !newItemName || newItemUnitPrice <= 0) {
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
    
    const updatedItems = [...order.items, newItem];
    
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
    
    // Reset new item fields
    setNewItemType("bouncer");
    setNewItemName("");
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemUnitPrice(0);
  };

  // Remove item from order
  const handleRemoveItem = (index: number) => {
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
    
    // Recalculate totals
    recalculateTotals(updatedItems);
  };

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
    const totalAmount = Math.round(
      (subtotal +
        (formData.taxAmount || order.taxAmount || 0) +
        (formData.deliveryFee || order.deliveryFee || 0) +
        processingFee -
        (formData.discountAmount || order.discountAmount || 0)) *
        100
    ) / 100;
    
    // Calculate balance due
    const balanceDue = Math.round(
      (totalAmount - (formData.depositAmount || order.depositAmount || 0)) * 100
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
      
      // Update order
      const updatedOrder = await updateOrder(params.id, {
        ...formData,
        contactId: typeof order.contactId === 'string' ? order.contactId : undefined
      });
      
      setSuccess("Order updated successfully");
      
      // Refresh order data after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error updating order:", error);
      setError(error instanceof Error ? error.message : "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
        <h1 className="text-2xl font-semibold">Edit Order: {order.orderNumber}</h1>
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
              <p className="text-sm text-gray-900">{order.customerName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{order.customerPhone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-sm text-gray-900">
                {order.customerAddress ? `${order.customerAddress}, ${order.customerCity}, ${order.customerState} ${order.customerZipCode}` : "N/A"}
              </p>
            </div>
          </div>
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Order Items</h2>
          
          {/* Existing Items */}
          {order.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Items</h3>
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
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.name}
                          {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                            className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value))}
                            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
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
            <h3 className="text-md font-medium mb-2">Add Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as OrderItemType)}
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
                  value={formData.subtotal !== undefined ? formData.subtotal : order.subtotal}
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
                  value={formData.taxAmount !== undefined ? formData.taxAmount : order.taxAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Amount
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount !== undefined ? formData.discountAmount : order.discountAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery Fee
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee !== undefined ? formData.deliveryFee : order.deliveryFee}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Processing Fee (3% of subtotal)
                <input
                  type="number"
                  name="processingFee"
                  value={formData.processingFee !== undefined ? formData.processingFee : order.processingFee}
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
                  value={formData.totalAmount !== undefined ? formData.totalAmount : order.totalAmount}
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
                  value={formData.depositAmount !== undefined ? formData.depositAmount : order.depositAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Balance Due
                <input
                  type="number"
                  name="balanceDue"
                  value={formData.balanceDue !== undefined ? formData.balanceDue : order.balanceDue}
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
                  value={formData.notes !== undefined ? formData.notes : order.notes || ""}
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
                    <div key={index} className="flex items-center justify-between">
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
