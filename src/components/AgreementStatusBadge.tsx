import React from "react";
import { AgreementStatus } from "@/types/order";
import { differenceInHours } from "date-fns";

interface AgreementStatusBadgeProps {
  status: AgreementStatus;
  deliveryDate?: Date;
  className?: string;
}

export const AgreementStatusBadge: React.FC<AgreementStatusBadgeProps> = ({
  status,
  deliveryDate,
  className = "",
}) => {
  const getStatusConfig = () => {
    const hoursUntilDelivery = deliveryDate
      ? differenceInHours(new Date(deliveryDate), new Date())
      : null;

    switch (status) {
      case "signed":
        return {
          text: "Agreement Signed",
          icon: "✅",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
        };

      case "viewed":
        if (hoursUntilDelivery !== null && hoursUntilDelivery <= 24) {
          return {
            text: "Viewed - URGENT",
            icon: "👀",
            bgColor: "bg-orange-100",
            textColor: "text-orange-800",
            borderColor: "border-orange-200",
          };
        }
        return {
          text: "Agreement Viewed",
          icon: "👀",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          borderColor: "border-blue-200",
        };

      case "pending":
        if (hoursUntilDelivery !== null) {
          if (hoursUntilDelivery <= 24) {
            return {
              text: "CRITICAL - Sign Now",
              icon: "🚨",
              bgColor: "bg-red-100",
              textColor: "text-red-800",
              borderColor: "border-red-200",
            };
          } else if (hoursUntilDelivery <= 48) {
            return {
              text: "URGENT - Sign Soon",
              icon: "⚠️",
              bgColor: "bg-yellow-100",
              textColor: "text-yellow-800",
              borderColor: "border-yellow-200",
            };
          }
        }
        return {
          text: "Agreement Pending",
          icon: "📝",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200",
        };

      case "not_sent":
      default:
        if (hoursUntilDelivery !== null && hoursUntilDelivery <= 48) {
          return {
            text: "NOT SENT - URGENT",
            icon: "❌",
            bgColor: "bg-red-100",
            textColor: "text-red-800",
            borderColor: "border-red-200",
          };
        }
        return {
          text: "Agreement Not Sent",
          icon: "❌",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span className="mr-1" role="img" aria-label={status}>
        {config.icon}
      </span>
      {config.text}
    </span>
  );
};

export default AgreementStatusBadge;
