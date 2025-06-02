import React from "react";
import {
  IonIcon,
  IonText,
  IonBadge,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  cashOutline,
  cardOutline,
  timeOutline,
  starOutline,
} from "ionicons/icons";
import { TaskCompensation, BonusType } from "../../types/task.types";
import { useI18n } from "../../hooks/common/useI18n";

interface CompensationDisplayProps {
  compensation: TaskCompensation;
  size?: "compact" | "standard" | "detailed";
  showBreakdown?: boolean;
  showPaymentMethod?: boolean;
  showPaymentSchedule?: boolean;
  className?: string;
}

const CompensationDisplay: React.FC<CompensationDisplayProps> = ({
  compensation,
  size = "standard",
  showBreakdown = false,
  showPaymentMethod = false,
  showPaymentSchedule = false,
  className = "",
}) => {
  const { formatCurrency } = useI18n();

  const getBonusIcon = (bonusType: BonusType): string => {
    switch (bonusType) {
      case "distance":
        return "🚗";
      case "difficulty":
        return "⚡";
      case "rush":
        return "🏃";
      case "weekend":
        return "📅";
      case "holiday":
        return "🎉";
      case "customer_rating":
        return "⭐";
      case "completion_time":
        return "⏱️";
      default:
        return "💰";
    }
  };

  const getPaymentMethodIcon = (method: string): string => {
    switch (method) {
      case "direct_deposit":
        return cardOutline;
      case "check":
        return cashOutline;
      case "paypal":
        return cardOutline;
      case "quickbooks":
        return cardOutline;
      default:
        return cashOutline;
    }
  };

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case "direct_deposit":
        return "Direct Deposit";
      case "check":
        return "Check";
      case "paypal":
        return "PayPal";
      case "quickbooks":
        return "QuickBooks";
      default:
        return method;
    }
  };

  const getPaymentScheduleLabel = (schedule: string): string => {
    switch (schedule) {
      case "immediate":
        return "Immediate";
      case "weekly":
        return "Weekly";
      case "bi_weekly":
        return "Bi-weekly";
      case "monthly":
        return "Monthly";
      default:
        return schedule;
    }
  };

  const totalBonusAmount = compensation.bonuses.reduce(
    (sum, bonus) => sum + bonus.amount,
    0
  );

  if (size === "compact") {
    return (
      <div className={`flex items-center ${className}`}>
        <IonIcon icon={cashOutline} className="mr-1 text-green-600" />
        <span className="font-semibold text-green-600">
          {formatCurrency(compensation.totalAmount)}
        </span>
        {compensation.bonuses.length > 0 && (
          <IonBadge color="warning" className="ml-1 text-xs">
            +{compensation.bonuses.length} bonus{compensation.bonuses.length > 1 ? "es" : ""}
          </IonBadge>
        )}
      </div>
    );
  }

  if (size === "standard") {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IonIcon icon={cashOutline} className="mr-2 text-green-600" />
            <div>
              <div className="font-semibold text-green-600">
                {formatCurrency(compensation.totalAmount)}
              </div>
              {showBreakdown && compensation.bonuses.length > 0 && (
                <div className="text-xs text-gray-500">
                  Base: {formatCurrency(compensation.baseAmount)}
                  {totalBonusAmount > 0 && (
                    <span> + {formatCurrency(totalBonusAmount)} bonus</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {compensation.bonuses.length > 0 && (
            <div className="flex items-center gap-1">
              {compensation.bonuses.slice(0, 3).map((bonus, index) => (
                <span key={index} className="text-sm" title={bonus.description}>
                  {getBonusIcon(bonus.type)}
                </span>
              ))}
              {compensation.bonuses.length > 3 && (
                <IonBadge color="warning" className="text-xs">
                  +{compensation.bonuses.length - 3}
                </IonBadge>
              )}
            </div>
          )}
        </div>

        {(showPaymentMethod || showPaymentSchedule) && (
          <div className="flex items-center gap-2 mt-1">
            {showPaymentMethod && (
              <IonChip className="text-xs">
                <IonIcon icon={getPaymentMethodIcon(compensation.paymentMethod)} />
                <IonLabel>{getPaymentMethodLabel(compensation.paymentMethod)}</IonLabel>
              </IonChip>
            )}
            {showPaymentSchedule && (
              <IonChip className="text-xs">
                <IonIcon icon={timeOutline} />
                <IonLabel>{getPaymentScheduleLabel(compensation.paymentSchedule)}</IonLabel>
              </IonChip>
            )}
          </div>
        )}
      </div>
    );
  }

  // Detailed view
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Total Amount */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <IonIcon icon={cashOutline} className="mr-2 text-green-600 text-lg" />
          <div>
            <IonText className="text-lg font-bold text-green-600">
              {formatCurrency(compensation.totalAmount)}
            </IonText>
            <div className="text-sm text-gray-500">Total Compensation</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        {/* Base Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Base Amount</span>
          <span className="font-medium">
            {formatCurrency(compensation.baseAmount)}
          </span>
        </div>

        {/* Bonuses */}
        {compensation.bonuses.map((bonus, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="mr-2">{getBonusIcon(bonus.type)}</span>
              <span className="text-sm text-gray-700">{bonus.description}</span>
            </div>
            <span className="font-medium text-green-600">
              +{formatCurrency(bonus.amount)}
            </span>
          </div>
        ))}

        {compensation.bonuses.length === 0 && (
          <div className="text-sm text-gray-500 italic">No bonuses applied</div>
        )}
      </div>

      {/* Payment Information */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Payment Method</span>
          <div className="flex items-center">
            <IonIcon 
              icon={getPaymentMethodIcon(compensation.paymentMethod)} 
              className="mr-1 text-blue-500" 
            />
            <span className="text-sm font-medium">
              {getPaymentMethodLabel(compensation.paymentMethod)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Payment Schedule</span>
          <div className="flex items-center">
            <IonIcon icon={timeOutline} className="mr-1 text-purple-500" />
            <span className="text-sm font-medium">
              {getPaymentScheduleLabel(compensation.paymentSchedule)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Currency</span>
          <span className="text-sm font-medium">{compensation.currency}</span>
        </div>
      </div>
    </div>
  );
};

export default CompensationDisplay;
