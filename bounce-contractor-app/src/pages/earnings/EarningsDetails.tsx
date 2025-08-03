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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonButton,
  IonBadge,
} from "@ionic/react";
import {
  cashOutline,
  trendingUpOutline,
  statsChartOutline,
  calendarOutline,
  checkmarkCircleOutline,
  starOutline,
} from "ionicons/icons";
import { useEarningsDetails } from "../../hooks/earnings/useEarningsDetails";
import { useI18n } from "../../hooks/common/useI18n";

const EarningsDetails: React.FC = () => {
  const { t, formatCurrency, formatDate } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const {
    data: earningsData,
    isLoading,
    error,
    refetch,
  } = useEarningsDetails();

  const handleRefresh = async (event: CustomEvent) => {
    await refetch();
    event.detail.complete();
  };

  const formatPeriodLabel = (
    period: string,
    type: "daily" | "weekly" | "monthly",
  ) => {
    const date = new Date(period);

    switch (type) {
      case "daily":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "weekly":
        return `Week of ${date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;
      case "monthly":
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      default:
        return period;
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
            <IonTitle>{t("earningsDetails.title")}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full">
            <IonText color="danger" className="text-center">
              <h2>{t("earningsDetails.errorLoadingEarningsDetails")}</h2>
              <p>{error.message}</p>
            </IonText>
            <IonButton onClick={() => refetch()} className="mt-4">
              {t("earningsDetails.tryAgain")}
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>{t("earningsDetails.title")}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex justify-center py-16">
            <IonSpinner name="crescent" />
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
          <IonTitle>{t("earningsDetails.title")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {earningsData && (
          <>
            {/* Summary Cards */}
            <div className="p-4 space-y-4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="flex items-center">
                    <IonIcon
                      icon={cashOutline}
                      className="mr-2 text-green-600"
                    />
                    {t("earningsDetails.earningsOverview")}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(earningsData.summary.totalEarnings)}
                      </div>
                      <IonText className="text-sm text-gray-600">
                        {t("earningsDetails.totalEarnings")}
                      </IonText>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {earningsData.summary.completedTasks}
                      </div>
                      <IonText className="text-sm text-gray-600">
                        {t("earningsDetails.completedTasks")}
                      </IonText>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {formatCurrency(earningsData.summary.averagePerTask)}
                      </div>
                      <IonText className="text-xs text-gray-600">
                        {t("earningsDetails.avgPerTask")}
                      </IonText>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {formatCurrency(earningsData.summary.last7DaysEarnings)}
                      </div>
                      <IonText className="text-xs text-gray-600">
                        {t("earningsDetails.last7Days")}
                      </IonText>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-indigo-600">
                        {formatCurrency(
                          earningsData.summary.last30DaysEarnings,
                        )}
                      </div>
                      <IonText className="text-xs text-gray-600">
                        {t("earningsDetails.last30Days")}
                      </IonText>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Performance Highlights */}
              {(earningsData.performance.bestDay ||
                earningsData.performance.bestWeek ||
                earningsData.performance.bestMonth) && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center">
                      <IonIcon
                        icon={starOutline}
                        className="mr-2 text-yellow-500"
                      />
                      {t("earningsDetails.performanceHighlights")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="space-y-3">
                      {earningsData.performance.bestDay && (
                        <div className="flex justify-between items-center">
                          <div>
                            <IonText className="font-medium">
                              {t("earningsDetails.bestDay")}
                            </IonText>
                            <br />
                            <IonText className="text-sm text-gray-600">
                              {formatDate(
                                new Date(earningsData.performance.bestDay.date),
                              )}
                            </IonText>
                          </div>
                          <IonBadge
                            color="success"
                            className="text-lg px-3 py-1"
                          >
                            {formatCurrency(
                              earningsData.performance.bestDay.amount,
                            )}
                          </IonBadge>
                        </div>
                      )}

                      {earningsData.performance.bestWeek && (
                        <div className="flex justify-between items-center">
                          <div>
                            <IonText className="font-medium">
                              {t("earningsDetails.bestWeek")}
                            </IonText>
                            <br />
                            <IonText className="text-sm text-gray-600">
                              {t("earningsDetails.weekOf")}{" "}
                              {formatDate(
                                new Date(
                                  earningsData.performance.bestWeek.weekStart,
                                ),
                              )}
                            </IonText>
                          </div>
                          <IonBadge
                            color="primary"
                            className="text-lg px-3 py-1"
                          >
                            {formatCurrency(
                              earningsData.performance.bestWeek.amount,
                            )}
                          </IonBadge>
                        </div>
                      )}

                      {earningsData.performance.bestMonth && (
                        <div className="flex justify-between items-center">
                          <div>
                            <IonText className="font-medium">
                              {t("earningsDetails.bestMonth")}
                            </IonText>
                            <br />
                            <IonText className="text-sm text-gray-600">
                              {new Date(
                                earningsData.performance.bestMonth.month +
                                  "-01",
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                              })}
                            </IonText>
                          </div>
                          <IonBadge
                            color="secondary"
                            className="text-lg px-3 py-1"
                          >
                            {formatCurrency(
                              earningsData.performance.bestMonth.amount,
                            )}
                          </IonBadge>
                        </div>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Earnings Trends */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="flex items-center">
                    <IonIcon
                      icon={trendingUpOutline}
                      className="mr-2 text-blue-600"
                    />
                    {t("earningsDetails.earningsTrends")}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSegment
                    value={selectedPeriod}
                    onIonChange={(e) =>
                      setSelectedPeriod(e.detail.value as any)
                    }
                    className="mb-4"
                  >
                    <IonSegmentButton value="daily">
                      <IonLabel>{t("earningsDetails.daily")}</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="weekly">
                      <IonLabel>{t("earningsDetails.weekly")}</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="monthly">
                      <IonLabel>{t("earningsDetails.monthly")}</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {earningsData.trends[selectedPeriod]
                      .slice(-10) // Show last 10 periods
                      .reverse() // Show most recent first
                      .map((item, index) => {
                        let period: string;

                        if (selectedPeriod === "daily") {
                          period = (item as { date: string; amount: number })
                            .date;
                        } else if (selectedPeriod === "weekly") {
                          period = (
                            item as { weekStart: string; amount: number }
                          ).weekStart;
                        } else {
                          period = (item as { month: string; amount: number })
                            .month;
                        }

                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <IonText className="font-medium">
                                {formatPeriodLabel(period, selectedPeriod)}
                              </IonText>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(item.amount)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Task Type Breakdown */}
              {earningsData.breakdown.byTaskType.length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center">
                      <IonIcon
                        icon={statsChartOutline}
                        className="mr-2 text-purple-600"
                      />
                      {t("earningsDetails.earningsByTaskType")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="space-y-3">
                      {earningsData.breakdown.byTaskType.map(
                        (taskType, index) => (
                          <div
                            key={index}
                            className="border-b border-gray-200 pb-3 last:border-b-0"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <IonText className="font-medium">
                                  {getTaskTypeDisplayName(taskType.taskType)}
                                </IonText>
                                <br />
                                <IonText className="text-sm text-gray-600">
                                  {taskType.count}{" "}
                                  {t("earningsDetails.tasksCompleted")}
                                </IonText>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  {formatCurrency(taskType.totalEarnings)}
                                </div>
                                <IonText className="text-sm text-gray-600">
                                  {formatCurrency(taskType.averagePerTask)}{" "}
                                  {t("earningsDetails.avg")}
                                </IonText>
                              </div>
                            </div>

                            {/* Simple progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (taskType.totalEarnings /
                                      earningsData.summary.totalEarnings) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default EarningsDetails;
