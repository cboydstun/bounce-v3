"use client";

import React from "react";
import { DeliveryTimeSlot as DeliveryTimeSlotType } from "../../utils/routeOptimization";
import styles from "./DeliverySchedule.module.css";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DistanceUnit, formatDistance } from "../../utils/unitConversions";

interface DeliveryTimeSlotProps {
  slot: DeliveryTimeSlotType;
  index: number;
  isEditable: boolean;
  units?: DistanceUnit;
  onSlotChange?: (updatedSlot: DeliveryTimeSlotType, index: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const DeliveryTimeSlot: React.FC<DeliveryTimeSlotProps> = ({
  slot,
  isEditable,
  units = "miles",
}) => {
  // Only use sortable functionality if in edit mode
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slot.contact._id,
    disabled: !isEditable,
  });

  // Apply styles for dragging only in edit mode
  const style = isEditable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 999 : "auto",
        position: "relative" as const,
      }
    : undefined;
  // Generate avatar URL based on bouncer name
  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format address for display
  const formatAddress = (slot: DeliveryTimeSlotType) => {
    const { streetAddress, city, state, partyZipCode } = slot.contact;
    return `${streetAddress || ""}, ${city || ""}, ${state || ""} ${partyZipCode || ""}`;
  };

  // Format party start time for display
  const formatPartyStartTime = (slot: DeliveryTimeSlotType) => {
    // Try to get party start time from contact first
    if (slot.contact.partyStartTime && slot.contact.partyStartTime.trim()) {
      const timeStr = slot.contact.partyStartTime.trim();
      const formattedTime = formatTime12Hour(timeStr);
      if (formattedTime) {
        return `🎉 Party starts: ${formattedTime}`;
      }
    }

    // Fallback to event date if available
    if (slot.order?.eventDate) {
      try {
        const eventDate = new Date(slot.order.eventDate);
        if (!isNaN(eventDate.getTime())) {
          const timeStr = eventDate.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `🎉 Party starts: ${timeStr}`;
        }
      } catch (error) {
        console.warn("Error parsing event date:", error);
      }
    }

    return "🎉 Party time: TBD";
  };

  // Helper function to format time in 12-hour format
  const formatTime12Hour = (timeStr: string): string | null => {
    try {
      // Handle various time formats
      if (timeStr.includes(":")) {
        const [hours, minutes] = timeStr
          .split(":")
          .map((str) => parseInt(str.trim()));
        if (!isNaN(hours) && !isNaN(minutes)) {
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      }
      return null;
    } catch (error) {
      console.warn("Error formatting time:", timeStr, error);
      return null;
    }
  };

  return isEditable ? (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${styles.draggableTimeSlot} ${isDragging ? styles.dragging : ""}`}
      {...attributes}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center">
          <div className="cursor-move mr-2" {...listeners}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-400"
            >
              <path d="M8 18h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V8H8v2zm-2 8h2V8H6v10zm12-10v10h2V8h-2z" />
            </svg>
          </div>
          <span className={styles.timeSlotTime}>
            {formatTime(slot.timeBlock.start)} -{" "}
            {formatTime(slot.timeBlock.end)}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className={styles.timeSlotInfo}>
          <img
            src={getAvatarUrl(slot.contact.bouncer)}
            alt={slot.contact.bouncer}
            className={styles.timeSlotImage}
          />
          <div className={styles.timeSlotDetails}>
            <div className={styles.timeSlotName}>{slot.contact.bouncer}</div>
            <div className={styles.timeSlotAddress}>{formatAddress(slot)}</div>
            {formatPartyStartTime(slot) && (
              <div className="text-xs text-gray-600 mt-1">
                {formatPartyStartTime(slot)}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`${styles.timeSlotActivity} ${styles.activityDelivery}`}
        >
          Delivery
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={styles.timeSlotTravel}>
          {Math.round(slot.travelInfo.duration / 60)} min (
          {formatDistance(slot.travelInfo.distance, units)})
        </span>
      </td>
    </tr>
  ) : (
    <tr className="">
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={styles.timeSlotTime}>
          {formatTime(slot.timeBlock.start)} - {formatTime(slot.timeBlock.end)}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className={styles.timeSlotInfo}>
          <img
            src={getAvatarUrl(slot.contact.bouncer)}
            alt={slot.contact.bouncer}
            className={styles.timeSlotImage}
          />
          <div className={styles.timeSlotDetails}>
            <div className={styles.timeSlotName}>{slot.contact.bouncer}</div>
            <div className={styles.timeSlotAddress}>{formatAddress(slot)}</div>
            {formatPartyStartTime(slot) && (
              <div className="text-xs text-gray-600 mt-1">
                {formatPartyStartTime(slot)}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`${styles.timeSlotActivity} ${styles.activityDelivery}`}
        >
          Delivery
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={styles.timeSlotTravel}>
          {Math.round(slot.travelInfo.duration / 60)} min (
          {formatDistance(slot.travelInfo.distance, units)})
        </span>
      </td>
    </tr>
  );
};

export default DeliveryTimeSlot;
