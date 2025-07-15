import { useMemo } from "react";
import { Order } from "@/types/order";

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  agreementStats: {
    signed: number;
    sent: number;
    notSent: number;
  };
  readyForDelivery: number;
}

export const useOrderStats = (orders: Order[]): OrderStats => {
  return useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const agreementStats = {
      signed: orders.filter((o) => o.agreementStatus === "signed").length,
      sent: orders.filter(
        (o) =>
          o.agreementStatus === "pending" || o.agreementStatus === "viewed",
      ).length,
      notSent: orders.filter((o) => o.agreementStatus === "not_sent").length,
    };

    const readyForDelivery = agreementStats.signed + agreementStats.sent;

    return {
      totalOrders: orders.length,
      totalRevenue,
      agreementStats,
      readyForDelivery,
    };
  }, [orders]);
};
