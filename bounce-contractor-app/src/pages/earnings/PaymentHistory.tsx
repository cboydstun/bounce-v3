import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonIcon,
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonDatetime,
  IonButton,
  IonPopover,
  IonSpinner,
  IonAlert,
} from "@ionic/react";
import {
  cashOutline,
  calendarOutline,
  locationOutline,
  filterOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { usePaymentHistory } from "../../hooks/earnings/usePaymentHistory";
import { useI18n } from "../../hooks/common/useI18n";
import { PaymentHistoryFilters } from "../../services/api/earningsService";

const PaymentHistory: React.FC = () => {
  const { formatCurrency, formatDate } = useI18n();
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    page: 1,
    limit: 20,
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = usePaymentHistory({ filters });

  const handleRefresh = async (event: CustomEvent) => {
    await refetch();
    event.detail.complete();
  };

  const handleLoadMore = async (event: CustomEvent) => {
    // For now, just complete the event since we're using simple pagination
    (event.target as any)?.complete();
  };

  const handleDateFilter = (startDate?: string, endDate?: string) => {
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
      page: 1, // Reset to first page when filtering
    }));
    setShowDateFilter(false);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "danger";
      default:
        return "medium";
    }
  };

  const getTaskTypeDisplayName = (taskType: string) => {
    return taskType.replace(/([A-Z])/g, " $1").trim();
  };

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Payment History</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full">
            <IonText color="danger" className="text-center">
              <h2>Error Loading Payment History</h2>
              <p>{error.message}</p>
            </IonText>
            <IonButton onClick={() => refetch()} className="mt-4">
              Try Again
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Payment History</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowDateFilter(true)}>
              <IonIcon icon={filterOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Summary Card */}
        {paymentData?.summary && (
          <IonCard className="mx-4 mt-4">
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon icon={cashOutline} className="mr-2 text-green-600" />
                Payment Summary
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {paymentData.summary.totalPayments}
                  </div>
                  <IonText className="text-sm text-gray-600">
                    Total Payments
                  </IonText>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(paymentData.summary.totalAmount)}
                  </div>
                  <IonText className="text-sm text-gray-600">
                    Total Amount
                  </IonText>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(paymentData.summary.averagePayment)}
                  </div>
                  <IonText className="text-sm text-gray-600">
                    Average Payment
                  </IonText>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Active Filters */}
        {(filters.startDate || filters.endDate) && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
              <div className="flex items-center">
                <IonIcon icon={filterOutline} className="mr-2 text-blue-600" />
                <IonText className="text-sm text-blue-800">
                  Filtered by date range
                </IonText>
              </div>
              <IonButton
                fill="clear"
                size="small"
                color="primary"
                onClick={clearFilters}
              >
                Clear
              </IonButton>
            </div>
          </div>
        )}

        {/* Payment List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <IonSpinner name="crescent" />
          </div>
        ) : paymentData?.payments && paymentData.payments.length > 0 ? (
          <IonList className="px-4">
            {paymentData.payments.map((payment) => (
              <IonCard key={payment.id} className="mb-4">
                <IonCardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {payment.taskTitle}
                      </h3>
                      <IonText className="text-sm text-gray-600">
                        Order #{payment.orderId}
                      </IonText>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <IonBadge
                        color={getPaymentStatusColor(payment.paymentStatus)}
                        className="mt-1"
                      >
                        {payment.paymentStatus.toUpperCase()}
                      </IonBadge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <IonIcon icon={calendarOutline} className="mr-2" />
                      <span>
                        Paid on {formatDate(new Date(payment.paymentDate))}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <IonIcon icon={locationOutline} className="mr-2" />
                      <span className="truncate">{payment.address}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <IonIcon icon={checkmarkCircleOutline} className="mr-2" />
                      <span>
                        {getTaskTypeDisplayName(payment.taskType)} • Completed{" "}
                        {formatDate(new Date(payment.completedDate))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <IonText className="text-xs text-gray-500">
                      Payment Method:{" "}
                      {payment.paymentMethod.replace(/_/g, " ").toUpperCase()}
                    </IonText>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <IonIcon
              icon={cashOutline}
              className="text-6xl text-gray-300 mb-4"
            />
            <IonText className="text-center text-gray-500">
              <h2>No Payment History</h2>
              <p>Complete tasks to see your payment history here.</p>
            </IonText>
          </div>
        )}

        {/* Future: Add pagination controls here */}

        {/* Date Filter Popover */}
        <IonPopover
          isOpen={showDateFilter}
          onDidDismiss={() => setShowDateFilter(false)}
        >
          <div className="p-4">
            <h3 className="font-semibold mb-4">Filter by Date Range</h3>

            <div className="space-y-4">
              <div>
                <IonLabel>Start Date</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={filters.startDate}
                  onIonChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.detail.value as string,
                    }))
                  }
                />
              </div>

              <div>
                <IonLabel>End Date</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={filters.endDate}
                  onIonChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.detail.value as string,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowDateFilter(false)}
              >
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                onClick={() =>
                  handleDateFilter(filters.startDate, filters.endDate)
                }
              >
                Apply Filter
              </IonButton>
            </div>
          </div>
        </IonPopover>

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Information"
          message={alertMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default PaymentHistory;
