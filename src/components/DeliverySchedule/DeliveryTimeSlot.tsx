"use client";

import React from "react";
import { DeliveryTimeSlot as DeliveryTimeSlotType } from "../../utils/routeOptimization";
import styles from "./DeliverySchedule.module.css";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DeliveryTimeSlotProps {
  slot: DeliveryTimeSlotType;
  index: number;
  isEditable: boolean;
  onSlotChange?: (updatedSlot: DeliveryTimeSlotType, index: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const DeliveryTimeSlot: React.FC<DeliveryTimeSlotProps> = ({
  slot,
  isEditable,
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
          {(slot.travelInfo.distance / 1000).toFixed(1)} km)
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
          {(slot.travelInfo.distance / 1000).toFixed(1)} km)
        </span>
      </td>
    </tr>
  );
};

export default DeliveryTimeSlot;
