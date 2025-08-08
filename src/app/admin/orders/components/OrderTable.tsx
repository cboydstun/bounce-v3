import React from "react";
import Link from "next/link";
import { Order } from "@/types/order";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { parseDateCT } from "@/utils/dateUtils";
import {
  getStatusColor,
  getPaymentStatusColor,
  formatDate,
  formatCurrency,
  getCustomerDisplayName,
  getCustomerAddressDisplay,
} from "../utils/orderFormatters";
import AgreementStatusBadge from "@/components/AgreementStatusBadge";
import AgreementActions from "@/components/AgreementActions";
import DeliveryCountdown from "@/components/DeliveryCountdown";

interface OrderTableProps {
  orders: Order[];
  isDeleting: boolean;
  onDelete: (id: string) => void;
  onAgreementSent: () => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isDeleting,
  onDelete,
  onAgreementSent,
}) => {
  if (orders.length === 0) {
    return (
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Delivery Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Order Info
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Customer Details
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Agreement Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td
                colSpan={5}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No orders found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Delivery Date
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Order Info
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Customer Details
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Agreement Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              {/* Delivery Date Column */}
              <td className="px-4 py-4 whitespace-nowrap">
                <DeliveryCountdown
                  deliveryDate={
                    order.deliveryDate
                      ? parseDateCT(order.deliveryDate.toString().split("T")[0])
                      : undefined
                  }
                  eventDate={
                    order.eventDate
                      ? parseDateCT(order.eventDate.toString().split("T")[0])
                      : undefined
                  }
                  notes={order.notes}
                />
              </td>

              {/* Order Info Column */}
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="text-xs mt-1 flex items-center space-x-2">
                    <span className="text-gray-500">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </td>

              {/* Customer Details Column - Enhanced */}
              <td className="px-4 py-4">
                <div className="flex flex-col space-y-2">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {getCustomerDisplayName(order)}
                  </div>
                  {order.customerPhone && (
                    <div className="text-sm text-gray-700">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center hover:text-blue-600"
                      >
                        📞{" "}
                        <span className="ml-1 font-medium">
                          {order.customerPhone}
                        </span>
                      </a>
                    </div>
                  )}
                  {(order.customerAddress || order.customerCity) && (
                    <div className="text-sm text-gray-700">
                      <div className="flex items-start">
                        <span className="mr-1">📍</span>
                        <span className="font-medium">
                          {getCustomerAddressDisplay(order)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </td>

              {/* Agreement Status Column */}
              <td className="px-4 py-4">
                {/* Only show Agreement Status Badge if order is not cancelled or refunded */}
                {order.status !== "Cancelled" &&
                  order.status !== "Refunded" && (
                    <AgreementStatusBadge
                      status={order.agreementStatus || "not_sent"}
                      deliveryDate={
                        order.deliveryDate
                          ? new Date(order.deliveryDate)
                          : undefined
                      }
                    />
                  )}
                {/* Agreement Actions */}
                <AgreementActions
                  order={order}
                  onAgreementSent={onAgreementSent}
                />
              </td>

              {/* Actions Column */}
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <div className="flex flex-col space-y-2 items-end">
                  {/* Standard Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/orders/${order._id}/edit`}
                      className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      View
                    </Link>
                    {order.status !== "Paid" &&
                      order.status !== "Confirmed" && (
                        <button
                          onClick={() => onDelete(order._id)}
                          className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <LoadingSpinner className="w-3 h-3" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                      )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
