"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getOrderById } from "@/utils/api";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";

interface PageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: PageProps) {
  // For future Next.js compatibility, always use React.use() to unwrap params
  // This works in both current Next.js and future versions
  const unwrappedParams = use(params as any) as { id: string };
  const id = unwrappedParams.id;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          const orderData = await getOrderById(id);
          setOrder(orderData);
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

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format time for display
  const formatTime = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get status color
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Confirmed":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Authorized":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-gray-100 text-gray-800";
      case "Partially Refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format payment method for display
  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case "paypal":
        return "PayPal";
      case "cash":
        return "Cash";
      case "quickbooks":
        return "QuickBooks";
      case "free":
        return "Free";
      default:
        return method;
    }
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

  // If error occurred
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          {error}
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

  // If order not found
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          Order not found
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Order: {order.orderNumber}</h1>
        <div className="flex space-x-4">
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Orders
          </Link>
          <Link
            href={`/admin/orders/${order._id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Order
          </Link>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Order Date</p>
            <p className="text-sm text-gray-900">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                order.status as OrderStatus,
              )}`}
            >
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Payment Status</p>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                order.paymentStatus as PaymentStatus,
              )}`}
            >
              {order.paymentStatus}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Payment Method</p>
            <p className="text-sm text-gray-900">
              {formatPaymentMethod(order.paymentMethod)}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-sm text-gray-900">
              {order.customerName || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-sm text-gray-900">
              {order.customerEmail || "N/A"}
            </p>
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
                ? `${order.customerAddress}, ${order.customerCity || ""}, ${
                    order.customerState || ""
                  } ${order.customerZipCode || ""}`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Item
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Unit Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                    {item.description && (
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Totals */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-4">Order Totals</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Subtotal:</span>
            <span className="text-sm text-gray-900">
              ${order.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Tax:</span>
            <span className="text-sm text-gray-900">
              ${order.taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Delivery Fee:</span>
            <span className="text-sm text-gray-900">
              ${order.deliveryFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Processing Fee:</span>
            <span className="text-sm text-gray-900">
              ${order.processingFee.toFixed(2)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Discount:</span>
              <span className="text-sm text-red-600">
                -${order.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-base font-medium text-gray-900">Total:</span>
            <span className="text-base font-medium text-gray-900">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
          {order.depositAmount > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Deposit Paid:</span>
                <span className="text-sm text-gray-900">
                  ${order.depositAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-base font-medium text-gray-900">
                  Balance Due:
                </span>
                <span className="text-base font-medium text-gray-900">
                  ${order.balanceDue.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Information */}
      {order.paymentMethod === "paypal" &&
        order.paypalTransactions &&
        order.paypalTransactions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-medium mb-4">PayPal Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Transaction ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.paypalTransactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}{" "}
                        {formatTime(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Tasks */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-4">Tasks</h2>
        {order.tasks && order.tasks.length > 0 ? (
          <ul className="space-y-2">
            {order.tasks.map((task, index) => (
              <li
                key={index}
                className="flex items-center p-2 bg-gray-50 rounded"
              >
                <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-900">{task}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No tasks assigned to this order.
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-4">Notes</h2>
        {order.notes ? (
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {order.notes}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No notes for this order.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Link
          href={`/admin/orders/${order._id}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Order
        </Link>
      </div>
    </div>
  );
}
