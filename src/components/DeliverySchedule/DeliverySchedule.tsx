"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  OptimizedRoute,
  DeliveryTimeSlot as DeliveryTimeSlotType,
} from "../../utils/routeOptimization";
import DeliveryTimeSlot from "./DeliveryTimeSlot";
import PrintableTable from "./PrintableTable";
import styles from "./DeliverySchedule.module.css";
import { useReactToPrint } from "react-to-print";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface DeliveryScheduleProps {
  optimizedRoute: OptimizedRoute;
  startAddress: string;
  onScheduleChange?: (updatedRoute: OptimizedRoute) => void;
  editable?: boolean;
}

const DeliverySchedule: React.FC<DeliveryScheduleProps> = ({
  optimizedRoute,
  startAddress,
  onScheduleChange,
  editable = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [timeSlots, setTimeSlots] = useState<DeliveryTimeSlotType[]>(
    optimizedRoute.timeSlots,
  );

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Create a memoized array of IDs for the sortable context
  const itemIds = useMemo(
    () => timeSlots.map((slot) => slot.contact._id),
    [timeSlots],
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTimeSlots((items) => {
        const oldIndex = items.findIndex(
          (item) => item.contact._id === active.id,
        );
        const newIndex = items.findIndex(
          (item) => item.contact._id === over.id,
        );

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update the optimized route with the new order
        const updatedRoute = {
          ...optimizedRoute,
          timeSlots: newItems,
          deliveryOrder: newItems.map((slot) => slot.contact),
        };

        // Call the onScheduleChange callback if provided
        if (onScheduleChange) {
          onScheduleChange(updatedRoute);
        }

        return newItems;
      });
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Delivery Schedule",
    onAfterPrint: () => console.log("Printed successfully"),
  });

  // Handle save functionality
  const handleSave = () => {
    // In a real implementation, this would save to a database or file
    // For now, we'll just log to console and toggle edit mode
    console.log("Saving schedule:", optimizedRoute);
    setIsEditing(false);

    // Store in localStorage for persistence
    try {
      localStorage.setItem(
        `schedule_${optimizedRoute.startTime.toISOString().split("T")[0]}`,
        JSON.stringify(optimizedRoute),
      );
      alert("Schedule saved successfully!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule. Please try again.");
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className={styles.scheduleContainer} ref={scheduleRef}>
      <div className={styles.scheduleHeader}>
        <h2 className={styles.scheduleTitle}>Delivery Schedule</h2>
        <div className={styles.scheduleActions}>
          {editable && (
            <button
              className={`${styles.actionButton} ${
                isEditing ? styles.saveButton : ""
              }`}
              onClick={toggleEditMode}
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          )}
          {isEditing && (
            <button
              className={`${styles.actionButton} ${styles.saveButton}`}
              onClick={handleSave}
            >
              Save
            </button>
          )}
          <button
            className={`${styles.actionButton} ${styles.printButton}`}
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </div>

      {/* Main content - either editable or non-editable */}
      {isEditing && timeSlots.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className={styles.scheduleTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Location</th>
                <th>Activity</th>
                <th>Travel</th>
              </tr>
            </thead>
            <tbody className={styles.scheduleBody}>
              {/* Start location - no time */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={styles.timeSlotInfo}>
                    <div
                      className={styles.timeSlotImage}
                      style={{ backgroundColor: "#e5e7eb" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 m-auto text-gray-500"
                        style={{
                          width: "24px",
                          height: "24px",
                          margin: "8px auto",
                        }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className={styles.timeSlotDetails}>
                      <div className={styles.timeSlotName}>Start Location</div>
                      <div className={styles.timeSlotAddress}>
                        {startAddress}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`${styles.timeSlotActivity} ${styles.activityDeparture}`}
                  >
                    Departure
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
              </tr>

              {/* Delivery locations with drag and drop */}
              <SortableContext
                items={itemIds}
                strategy={verticalListSortingStrategy}
              >
                {timeSlots.map((slot, index) => (
                  <DeliveryTimeSlot
                    key={slot.contact._id}
                    slot={slot}
                    index={index}
                    isEditable={isEditing}
                    onSlotChange={(updatedSlot, idx) => {
                      // Handle slot changes when implemented
                      console.log("Slot changed:", updatedSlot, idx);
                    }}
                  />
                ))}
              </SortableContext>

              {/* Return to start if enabled */}
              {optimizedRoute.returnToStart && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(optimizedRoute.endTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={styles.timeSlotInfo}>
                      <div
                        className={styles.timeSlotImage}
                        style={{ backgroundColor: "#e5e7eb" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6 m-auto text-gray-500"
                          style={{
                            width: "24px",
                            height: "24px",
                            margin: "8px auto",
                          }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className={styles.timeSlotDetails}>
                        <div className={styles.timeSlotName}>
                          Return to Start
                        </div>
                        <div className={styles.timeSlotAddress}>
                          {startAddress}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`${styles.timeSlotActivity} ${styles.activityArrival}`}
                    >
                      Arrival
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {timeSlots.length > 0 &&
                    timeSlots[timeSlots.length - 1].travelInfo
                      ? `${Math.round(
                          timeSlots[timeSlots.length - 1].travelInfo.duration /
                            60,
                        )} min`
                      : "-"}
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {timeSlots.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.emptyMessage}>
                    No deliveries scheduled for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      ) : (
        // Non-editable mode - regular table without DndContext
        <table className={styles.scheduleTable}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Location</th>
              <th>Activity</th>
              <th>Travel</th>
            </tr>
          </thead>
          <tbody className={styles.scheduleBody}>
            {/* Start location - no time */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                -
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={styles.timeSlotInfo}>
                  <div
                    className={styles.timeSlotImage}
                    style={{ backgroundColor: "#e5e7eb" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 m-auto text-gray-500"
                      style={{
                        width: "24px",
                        height: "24px",
                        margin: "8px auto",
                      }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className={styles.timeSlotDetails}>
                    <div className={styles.timeSlotName}>Start Location</div>
                    <div className={styles.timeSlotAddress}>{startAddress}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`${styles.timeSlotActivity} ${styles.activityDeparture}`}
                >
                  Departure
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                -
              </td>
            </tr>

            {/* Delivery locations */}
            {timeSlots.map((slot, index) => (
              <DeliveryTimeSlot
                key={slot.contact._id}
                slot={slot}
                index={index}
                isEditable={false}
                onSlotChange={(updatedSlot, idx) => {
                  // Handle slot changes when implemented
                  console.log("Slot changed:", updatedSlot, idx);
                }}
              />
            ))}

            {/* Return to start if enabled */}
            {optimizedRoute.returnToStart && (
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTime(optimizedRoute.endTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={styles.timeSlotInfo}>
                    <div
                      className={styles.timeSlotImage}
                      style={{ backgroundColor: "#e5e7eb" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 m-auto text-gray-500"
                        style={{
                          width: "24px",
                          height: "24px",
                          margin: "8px auto",
                        }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className={styles.timeSlotDetails}>
                      <div className={styles.timeSlotName}>Return to Start</div>
                      <div className={styles.timeSlotAddress}>
                        {startAddress}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`${styles.timeSlotActivity} ${styles.activityArrival}`}
                  >
                    Arrival
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {timeSlots.length > 0 &&
                  timeSlots[timeSlots.length - 1].travelInfo
                    ? `${Math.round(
                        timeSlots[timeSlots.length - 1].travelInfo.duration /
                          60,
                      )} min`
                    : "-"}
                </td>
              </tr>
            )}

            {/* Empty state */}
            {timeSlots.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyMessage}>
                  No deliveries scheduled for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Hidden printable table */}
      <div className="hidden">
        <PrintableTable
          ref={printRef}
          timeSlots={timeSlots}
          startAddress={startAddress}
          formatTime={formatTime}
          returnToStart={optimizedRoute.returnToStart}
          endTime={optimizedRoute.endTime}
        />
      </div>
    </div>
  );
};

export default DeliverySchedule;
