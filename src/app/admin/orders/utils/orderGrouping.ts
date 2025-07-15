import { Order } from "@/types/order";
import { formatDateCT } from "@/utils/dateUtils";

// Group orders by delivery date and time for timeline view
export const groupOrdersByDeliveryTime = (orders: Order[]) => {
  const grouped: { [key: string]: Order[] } = {};

  orders.forEach((order) => {
    let timeSlot = "No Delivery Time";

    if (order.deliveryDate) {
      const deliveryDate = new Date(order.deliveryDate);
      const dateKey = formatDateCT(deliveryDate);

      // Extract time from notes if available, otherwise use default slots
      let timeKey = "All Day";
      if (order.notes) {
        const timeMatch = order.notes.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          timeKey = timeMatch[1];
        }
      }

      timeSlot = `${dateKey} - ${timeKey}`;
    }

    if (!grouped[timeSlot]) {
      grouped[timeSlot] = [];
    }
    grouped[timeSlot].push(order);
  });

  // Sort time slots
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "No Delivery Time") return 1;
    if (b === "No Delivery Time") return -1;
    return a.localeCompare(b);
  });

  const result: { [key: string]: Order[] } = {};
  sortedKeys.forEach((key) => {
    result[key] = grouped[key].sort((a, b) => {
      // Sort by delivery time within each slot
      if (a.deliveryDate && b.deliveryDate) {
        return (
          new Date(a.deliveryDate).getTime() -
          new Date(b.deliveryDate).getTime()
        );
      }
      return 0;
    });
  });

  return result;
};
