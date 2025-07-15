import { OrderStatus, PaymentStatus } from "@/types/order";
import { formatDisplayDateCT } from "@/utils/dateUtils";

// Helper function to get status color
export const getStatusColor = (status: OrderStatus): string => {
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

// Helper function to get payment status color
export const getPaymentStatusColor = (status: PaymentStatus): string => {
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

// Format date for display using our centralized date utility
export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return formatDisplayDateCT(date);
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

// Get customer display name
export const getCustomerDisplayName = (order: {
  customerName?: string;
  customerEmail?: string;
  contactId?: string | any;
}): string => {
  const contactId =
    typeof order.contactId === "string"
      ? order.contactId
      : order.contactId?._id || "Unknown";
  return (
    order.customerName || order.customerEmail || `Contact ID: ${contactId}`
  );
};

// Get customer address display
export const getCustomerAddressDisplay = (order: {
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
}): string => {
  return [order.customerAddress, order.customerCity, order.customerState]
    .filter(Boolean)
    .join(", ");
};
