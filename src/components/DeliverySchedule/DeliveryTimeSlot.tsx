"use client";

import React from "react";
import { DeliveryTimeSlot as DeliveryTimeSlotType } from "../../utils/routeOptimization";
import styles from "./DeliverySchedule.module.css";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DistanceUnit, formatDistance } from "../../utils/unitConversions";
import { HideReason } from "../../utils/hideDeliveries";

interface DeliveryTimeSlotProps {
  slot: DeliveryTimeSlotType;
  index: number;
  isEditable: boolean;
  units?: DistanceUnit;
  onSlotChange?: (updatedSlot: DeliveryTimeSlotType, index: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onHideDelivery?: (deliveryId: string, reason: HideReason) => void;
  onShowDelivery?: (deliveryId: string) => void;
  selectedForBulk?: boolean;
  onBulkSelect?: (deliveryId: string, selected: boolean) => void;
}

const DeliveryTimeSlot: React.FC<DeliveryTimeSlotProps> = ({
  slot,
  isEditable,
  units = "miles",
  onHideDelivery,
  onShowDelivery,
  selectedForBulk,
  onBulkSelect,
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

  // Handle hide/show actions
  const handleHideClick = () => {
    if (onHideDelivery) {
      onHideDelivery(slot.contact._id, "manual");
    }
  };

  const handleShowClick = () => {
    if (onShowDelivery) {
      onShowDelivery(slot.contact._id);
    }
  };

  const handleBulkSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBulkSelect) {
      onBulkSelect(slot.contact._id, e.target.checked);
    }
  };

  // Determine if this delivery is hidden
  const isHidden = slot.isHidden || false;

  return isEditable ? (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${styles.draggableTimeSlot} ${isDragging ? styles.dragging : ""} ${
        isHidden ? "opacity-50 bg-gray-50" : ""
      }`}
      {...attributes}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center">
          {onBulkSelect && (
            <input
              type="checkbox"
              checked={selectedForBulk || false}
              onChange={handleBulkSelectChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
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
            <div
              className={`${styles.timeSlotName} ${isHidden ? "line-through" : ""}`}
            >
              {slot.contact.bouncer}
              {isHidden && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Hidden
                </span>
              )}
            </div>
            <div
              className={`${styles.timeSlotAddress} ${isHidden ? "line-through" : ""}`}
            >
              {formatAddress(slot)}
            </div>
            {formatPartyStartTime(slot) && (
              <div
                className={`text-xs text-gray-600 mt-1 ${isHidden ? "line-through" : ""}`}
              >
                {formatPartyStartTime(slot)}
              </div>
            )}
            {isHidden && slot.hideReason && (
              <div className="text-xs text-orange-600 mt-1">
                Reason: {slot.hideReason.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`${styles.timeSlotActivity} ${styles.activityDelivery} ${
            isHidden ? "line-through" : ""
          }`}
        >
          Delivery
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`${styles.timeSlotTravel} ${isHidden ? "line-through" : ""}`}
        >
          {Math.round(slot.travelInfo.duration / 60)} min (
          {formatDistance(slot.travelInfo.distance, units)})
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center space-x-2">
          {isHidden ? (
            <button
              onClick={handleShowClick}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              title="Show delivery"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Show
            </button>
          ) : (
            <button
              onClick={handleHideClick}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Hide delivery"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
              Hide
            </button>
          )}
        </div>
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
