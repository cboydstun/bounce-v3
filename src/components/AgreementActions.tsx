import React, { useState } from "react";
import { Order, AgreementStatus } from "@/types/order";
import {
  sendAgreement,
  resendAgreement,
  syncAgreementStatus,
} from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AgreementActionsProps {
  order: Order;
  onAgreementSent?: () => void;
  className?: string;
}

export const AgreementActions: React.FC<AgreementActionsProps> = ({
  order,
  onAgreementSent,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendAgreement = async () => {
    if (!order.customerEmail) {
      setError("Customer email is required to send agreement");
      return;
    }

    // Check if order is cancelled or refunded
    if (order.status === "Cancelled" || order.status === "Refunded") {
      setError("Cannot send agreement to cancelled or refunded orders");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isResend =
        order.agreementStatus === "pending" ||
        order.agreementStatus === "viewed";

      if (isResend) {
        await resendAgreement(order._id);
        setSuccess("Agreement resent successfully!");
      } else {
        await sendAgreement(order._id);
        setSuccess("Agreement sent successfully!");
      }

      // Call the callback to refresh the parent component
      if (onAgreementSent) {
        onAgreementSent();
      }
    } catch (err) {
      console.error("Error sending agreement:", err);

      // Provide more user-friendly error messages
      let errorMessage = "Failed to send agreement";

      if (err instanceof Error) {
        if (err.message.includes("Customer email is required")) {
          errorMessage = "Customer email is required to send agreement";
        } else if (err.message.includes("already been signed")) {
          errorMessage = "Agreement has already been signed";
        } else if (err.message.includes("DocuSeal")) {
          errorMessage =
            "There was an issue with the document service. Please try again.";
        } else if (err.message.includes("Failed to create or send agreement")) {
          errorMessage =
            "Unable to create agreement document. Please check the order details and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncStatus = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await syncAgreementStatus(order._id);

      if (result.updated) {
        setSuccess(`Status synced: ${result.status}`);
        // Call the callback to refresh the parent component
        if (onAgreementSent) {
          onAgreementSent();
        }
      } else {
        setSuccess(result.status);
      }
    } catch (err) {
      console.error("Error syncing agreement status:", err);
      setError(err instanceof Error ? err.message : "Failed to sync status");
    } finally {
      setIsSyncing(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Sending...";

    const status = order.agreementStatus || "not_sent";
    switch (status) {
      case "signed":
        return "Agreement Signed";
      case "pending":
      case "viewed":
        return "Resend Agreement";
      case "not_sent":
      default:
        return "Send Agreement";
    }
  };

  const getButtonStyle = () => {
    const status = order.agreementStatus || "not_sent";

    if (status === "signed") {
      return "bg-green-100 text-green-800 cursor-not-allowed";
    }

    if (isLoading) {
      return "bg-gray-100 text-gray-600 cursor-not-allowed";
    }

    const isUrgent =
      order.deliveryDate &&
      new Date(order.deliveryDate).getTime() - new Date().getTime() <=
        48 * 60 * 60 * 1000;

    if (isUrgent && status !== ("signed" as AgreementStatus)) {
      return "bg-red-600 text-white hover:bg-red-700 animate-pulse";
    }

    return "bg-blue-600 text-white hover:bg-blue-700";
  };

  const isDisabled =
    (order.agreementStatus || "not_sent") === "signed" ||
    isLoading ||
    !order.customerEmail ||
    order.status === "Cancelled" ||
    order.status === "Refunded";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        {/* Only show Send Agreement button if order is not cancelled or refunded */}
        {order.status !== "Cancelled" && order.status !== "Refunded" && (
          <button
            onClick={handleSendAgreement}
            disabled={isDisabled}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors ${getButtonStyle()}`}
          >
            {isLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
            {(order.agreementStatus || "not_sent") === "signed" && (
              <span className="mr-2" role="img" aria-label="signed">
                ✅
              </span>
            )}
            {getButtonText()}
          </button>
        )}

        {/* Sync Status Button - only show if there's a submission ID */}
        {order.docusealSubmissionId && (
          <button
            onClick={handleSyncStatus}
            disabled={isSyncing}
            className="inline-flex items-center px-2 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            title="Sync agreement status with DocuSeal"
          >
            {isSyncing && <LoadingSpinner className="w-4 h-4 mr-1" />}
            {isSyncing ? "Syncing..." : "🔄"}
          </button>
        )}
      </div>

      {/* Show customer email if available and order is not cancelled/refunded */}
      {order.customerEmail &&
        order.status !== "Cancelled" &&
        order.status !== "Refunded" && (
          <div className="text-xs text-gray-500">
            Will send to: {order.customerEmail}
          </div>
        )}

      {/* Show error message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Show success message */}
      {success && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
          {success}
        </div>
      )}

      {/* Show warning if no email */}
      {!order.customerEmail && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
          ⚠️ No customer email on file
        </div>
      )}

      {/* Show message for cancelled/refunded orders */}
      {(order.status === "Cancelled" || order.status === "Refunded") && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          🚫 Order {order.status.toLowerCase()} - Agreement cannot be sent
        </div>
      )}

      {/* Show delivery warning */}
      {order.deliveryDate &&
        (order.agreementStatus || "not_sent") !== "signed" &&
        (() => {
          const hoursUntilDelivery = Math.floor(
            (new Date(order.deliveryDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60),
          );

          if (hoursUntilDelivery <= 24 && hoursUntilDelivery > 0) {
            return (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                🚨 Delivery in {hoursUntilDelivery}h - Agreement required!
              </div>
            );
          } else if (hoursUntilDelivery <= 48 && hoursUntilDelivery > 24) {
            return (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                ⚠️ Delivery in {Math.round(hoursUntilDelivery)}h - Send
                agreement soon
              </div>
            );
          } else if (hoursUntilDelivery <= 0) {
            return (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                🚨 Delivery overdue - Agreement still needed!
              </div>
            );
          }
          return null;
        })()}

      {/* Show agreement timestamps */}
      {order.agreementSentAt && (
        <div className="text-xs text-gray-500">
          <div>Sent: {new Date(order.agreementSentAt).toLocaleString()}</div>
          {order.agreementViewedAt && (
            <div>
              Viewed: {new Date(order.agreementViewedAt).toLocaleString()}
            </div>
          )}
          {order.agreementSignedAt && (
            <div>
              Signed: {new Date(order.agreementSignedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgreementActions;
