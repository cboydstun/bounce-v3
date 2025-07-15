import React from "react";
import Link from "next/link";
import { Order } from "@/types/order";
import { groupOrdersByDeliveryTime } from "../utils/orderGrouping";
import {
  getCustomerDisplayName,
  getCustomerAddressDisplay,
  formatCurrency,
} from "../utils/orderFormatters";
import AgreementStatusBadge from "@/components/AgreementStatusBadge";
import AgreementActions from "@/components/AgreementActions";

interface OrderTimelineProps {
  orders: Order[];
  onAgreementSent: () => void;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  orders,
  onAgreementSent,
}) => {
  const groupedOrders = groupOrdersByDeliveryTime(orders);

  if (Object.keys(groupedOrders).length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500">No orders found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {Object.entries(groupedOrders).map(([timeSlot, timeOrders]) => (
          <div key={timeSlot} className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {timeSlot}
              </h3>
              <span className="text-sm text-gray-500">
                {timeOrders.length} order
                {timeOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {timeOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                    <AgreementStatusBadge
                      status={order.agreementStatus || "not_sent"}
                      deliveryDate={
                        order.deliveryDate
                          ? new Date(order.deliveryDate)
                          : undefined
                      }
                    />
                  </div>

                  {/* Customer Info - Prominent */}
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <div className="font-medium text-gray-900 mb-2">
                      {getCustomerDisplayName(order)}
                    </div>
                    {order.customerPhone && (
                      <div className="text-sm text-gray-700 mb-1">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center hover:text-blue-600"
                        >
                          📞 {order.customerPhone}
                        </a>
                      </div>
                    )}
                    {(order.customerAddress || order.customerCity) && (
                      <div className="text-sm text-gray-700">
                        📍 {getCustomerAddressDisplay(order)}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
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
                  </div>

                  {/* Agreement Actions */}
                  <div className="mt-2">
                    <AgreementActions
                      order={order}
                      onAgreementSent={onAgreementSent}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
