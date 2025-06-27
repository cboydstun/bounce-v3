import React from "react";
import { differenceInHours, differenceInDays } from "date-fns";
import { formatDisplayDateCT } from "@/utils/dateUtils";

interface DeliveryCountdownProps {
  deliveryDate?: Date;
  eventDate?: Date;
  notes?: string;
  className?: string;
}

// Utility function to parse delivery date from notes
const parseDeliveryDateFromNotes = (notes: string): Date | null => {
  if (!notes) return null;

  // Look for patterns like "Delivery: 2025-08-02 12:00" or "Delivery: 2025-08-02"
  const deliveryRegex =
    /Delivery:\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}:\d{2}))?/i;
  const match = notes.match(deliveryRegex);

  if (match) {
    const dateStr = match[1]; // YYYY-MM-DD
    const timeStr = match[2] || "12:00"; // Default to noon if no time specified

    try {
      const parsedDate = new Date(`${dateStr}T${timeStr}:00`);
      // Validate that the date is reasonable (not invalid)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (error) {
      console.warn("Failed to parse delivery date from notes:", error);
    }
  }

  return null;
};

export const DeliveryCountdown: React.FC<DeliveryCountdownProps> = ({
  deliveryDate,
  eventDate,
  notes,
  className = "",
}) => {
  // Use deliveryDate if available, otherwise fall back to eventDate, then parse from notes
  const parsedFromNotes = parseDeliveryDateFromNotes(notes || "");
  const targetDate = deliveryDate || eventDate || parsedFromNotes;

  if (!targetDate) {
    return (
      <span className={`text-gray-500 text-sm ${className}`}>
        No delivery date set
      </span>
    );
  }

  const now = new Date();
  const delivery = new Date(targetDate);
  const hoursUntilDelivery = differenceInHours(delivery, now);
  const daysUntilDelivery = differenceInDays(delivery, now);

  const getCountdownConfig = () => {
    if (hoursUntilDelivery < 0) {
      return {
        text: "Delivery Overdue",
        icon: "🚨",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
      };
    }

    if (hoursUntilDelivery <= 24) {
      return {
        text:
          hoursUntilDelivery <= 1
            ? "Delivery in < 1 hour"
            : `Delivery in ${hoursUntilDelivery}h`,
        icon: "🚨",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
      };
    }

    if (hoursUntilDelivery <= 48) {
      return {
        text: `Delivery in ${Math.round(hoursUntilDelivery)}h`,
        icon: "⚠️",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
      };
    }

    if (daysUntilDelivery <= 7) {
      return {
        text:
          daysUntilDelivery === 1
            ? "Delivery tomorrow"
            : `Delivery in ${daysUntilDelivery} days`,
        icon: "📅",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
      };
    }

    return {
      text: `Delivery in ${daysUntilDelivery} days`,
      icon: "📅",
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      borderColor: "border-gray-200",
    };
  };

  const config = getCountdownConfig();
  const formattedDate = formatDisplayDateCT(delivery);

  return (
    <div className={`${className}`}>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      >
        <span className="mr-1" role="img" aria-label="countdown">
          {config.icon}
        </span>
        {config.text}
      </span>
      <div className="text-xs text-gray-500 mt-1">{formattedDate}</div>
    </div>
  );
};

export default DeliveryCountdown;
