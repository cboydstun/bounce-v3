"use client";

import React, { forwardRef } from "react";
import { DeliveryTimeSlot as DeliveryTimeSlotType } from "../../utils/routeOptimization";
import DeliveryTimeSlot from "./DeliveryTimeSlot";
import styles from "./DeliverySchedule.module.css";

interface PrintableTableProps {
  timeSlots: DeliveryTimeSlotType[];
  startAddress: string;
  formatTime: (date: Date) => string;
  returnToStart?: boolean;
  endTime?: Date;
}

const PrintableTable = forwardRef<HTMLDivElement, PrintableTableProps>(
  ({ timeSlots, startAddress, formatTime, returnToStart, endTime }, ref) => {
    return (
      <div ref={ref} className="print-container">
        <h2 className="text-xl font-bold mb-4">Delivery Schedule</h2>
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
            {returnToStart && endTime && (
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTime(endTime)}
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
                    ? `Est. travel: ${Math.round(
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
      </div>
    );
  },
);

PrintableTable.displayName = "PrintableTable";

export default PrintableTable;
