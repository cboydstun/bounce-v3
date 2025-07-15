import React from "react";
import { OrderStats } from "../hooks/useOrderStats";
import { formatCurrency } from "../utils/orderFormatters";

interface OrderSummaryStatsProps {
  stats: OrderStats;
}

export const OrderSummaryStats: React.FC<OrderSummaryStatsProps> = ({
  stats,
}) => {
  if (stats.totalOrders === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalOrders}
          </div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>

        <div className="text-center">
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {stats.agreementStats.signed}
              </div>
              <div className="text-xs text-gray-500">Signed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {stats.agreementStats.sent}
              </div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {stats.agreementStats.notSent}
              </div>
              <div className="text-xs text-gray-500">Not Sent</div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">Agreements</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {stats.readyForDelivery}/{stats.totalOrders}
          </div>
          <div className="text-sm text-gray-500">Ready for Delivery</div>
        </div>
      </div>
    </div>
  );
};
