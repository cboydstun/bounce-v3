import React from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonButton,
} from "@ionic/react";
import {
  cashOutline,
  trendingUpOutline,
  checkmarkCircleOutline,
  statsChartOutline,
} from "ionicons/icons";
import { useI18n } from "../../hooks/common/useI18n";

interface EarningsData {
  totalEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  completedTasks: number;
  averagePerTask: number;
}

interface EarningsSummaryProps {
  earnings: EarningsData;
  isLoading?: boolean;
  onViewDetails?: () => void;
  onViewPaymentHistory?: () => void;
}

const EarningsSummary: React.FC<EarningsSummaryProps> = ({
  earnings,
  isLoading = false,
  onViewDetails,
  onViewPaymentHistory,
}) => {
  const { formatCurrency } = useI18n();

  if (isLoading) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Earnings Summary</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="flex justify-center py-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="earnings-summary">
      <IonCardHeader>
        <div className="flex items-center justify-between">
          <IonCardTitle className="flex items-center">
            <IonIcon icon={cashOutline} className="mr-2 text-green-600" />
            Earnings Summary
          </IonCardTitle>
          <IonButton
            fill="clear"
            size="small"
            onClick={onViewDetails}
            className="text-primary"
          >
            <IonIcon icon={statsChartOutline} slot="icon-only" />
          </IonButton>
        </div>
      </IonCardHeader>

      <IonCardContent>
        <div className="space-y-4">
          {/* Total Earnings */}
          <div className="text-center bg-green-50 rounded-lg p-4">
            <IonText className="text-3xl font-bold text-green-600 block">
              {formatCurrency(earnings.totalEarnings)}
            </IonText>
            <IonText className="text-sm text-green-700">Total Earnings</IonText>
          </div>

          {/* Period Earnings */}
          <IonGrid className="px-0">
            <IonRow>
              <IonCol size="6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <IonText className="text-lg font-semibold text-blue-600 block">
                    {formatCurrency(earnings.thisWeekEarnings)}
                  </IonText>
                  <IonText className="text-xs text-blue-700">This Week</IonText>
                </div>
              </IonCol>
              <IonCol size="6">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <IonText className="text-lg font-semibold text-purple-600 block">
                    {formatCurrency(earnings.thisMonthEarnings)}
                  </IonText>
                  <IonText className="text-xs text-purple-700">
                    This Month
                  </IonText>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IonIcon
                  icon={checkmarkCircleOutline}
                  className="mr-2 text-green-500"
                />
                <span className="text-sm text-gray-700">Completed Tasks</span>
              </div>
              <IonBadge color="success">{earnings.completedTasks}</IonBadge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IonIcon
                  icon={trendingUpOutline}
                  className="mr-2 text-blue-500"
                />
                <span className="text-sm text-gray-700">Average per Task</span>
              </div>
              <span className="font-medium text-blue-600">
                {formatCurrency(earnings.averagePerTask)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <IonButton
              expand="block"
              fill="outline"
              size="small"
              onClick={onViewPaymentHistory}
              className="flex-1"
            >
              Payment History
            </IonButton>
            <IonButton
              expand="block"
              fill="solid"
              size="small"
              onClick={onViewDetails}
              className="flex-1"
            >
              View Details
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default EarningsSummary;
