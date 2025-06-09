import React, { useState } from "react";
import { Order, AgreementStatus } from "@/types/order";
import { sendAgreement, resendAgreement } from "@/utils/api";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendAgreement = async () => {
    if (!order.customerEmail) {
      setError("Customer email is required to send agreement");
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
      setError(err instanceof Error ? err.message : "Failed to send agreement");
    } finally {
      setIsLoading(false);
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
    !order.customerEmail;

  return (
    <div className={`space-y-2 ${className}`}>
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

      {/* Show customer email if available */}
      {order.customerEmail && (
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
