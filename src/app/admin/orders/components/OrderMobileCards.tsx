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

interface OrderMobileCardsProps {
  orders: Order[];
  isDeleting: boolean;
  onDelete: (id: string) => void;
  onAgreementSent: () => void;
}

export const OrderMobileCards: React.FC<OrderMobileCardsProps> = ({
  orders,
  isDeleting,
  onDelete,
  onAgreementSent,
}) => {
  if (orders.length === 0) {
    return (
      <div className="md:hidden">
        <div className="p-6 text-center text-sm text-gray-500">
          No orders found
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden">
      <div className="divide-y divide-gray-200">
        {orders.map((order) => (
          <div key={order._id} className="p-4 hover:bg-gray-50">
            {/* Card Header - Delivery Date */}
            <div className="mb-3">
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
            </div>

            {/* Card Body - Order Info and Customer */}
            <div className="grid grid-cols-1 gap-3 mb-3">
              {/* Order Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {order.orderNumber}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Order Date: {formatDate(order.createdAt)}</div>
                  <div>Total: {formatCurrency(order.totalAmount)}</div>
                  <div className="flex space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {getCustomerDisplayName(order)}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {order.customerPhone && <div>📞 {order.customerPhone}</div>}
                  {(order.customerAddress || order.customerCity) && (
                    <div>📍 {getCustomerAddressDisplay(order)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer - Agreement and Actions */}
            <div className="space-y-3">
              {/* Agreement Status */}
              <div>
                <AgreementStatusBadge
                  status={order.agreementStatus || "not_sent"}
                  deliveryDate={
                    order.deliveryDate
                      ? new Date(order.deliveryDate)
                      : undefined
                  }
                />
              </div>

              {/* Agreement Actions */}
              <div>
                <AgreementActions
                  order={order}
                  onAgreementSent={onAgreementSent}
                />
              </div>

              {/* Standard Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/admin/orders/${order._id}/edit`}
                  className="flex-1 text-center text-blue-600 hover:text-blue-900 text-sm py-2 px-3 rounded border border-blue-200 hover:bg-blue-50"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="flex-1 text-center text-gray-600 hover:text-gray-900 text-sm py-2 px-3 rounded border border-gray-200 hover:bg-gray-50"
                >
                  View
                </Link>
                {order.status !== "Paid" && order.status !== "Confirmed" && (
                  <button
                    onClick={() => onDelete(order._id)}
                    className="flex-1 text-red-600 hover:text-red-900 text-sm py-2 px-3 rounded border border-red-200 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <LoadingSpinner className="w-4 h-4 mx-auto" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
