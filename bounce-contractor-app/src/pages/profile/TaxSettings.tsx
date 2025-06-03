/**
 * TaxSettings Component
 *
 * Comprehensive tax settings and W-9 management page for contractors.
 * Provides access to W-9 form status, QuickBooks integration, tax documents,
 * and compliance information.
 */

import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonBadge,
  IonList,
  IonText,
  IonButtons,
  IonBackButton,
  IonAlert,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import {
  documentTextOutline,
  checkmarkCircleOutline,
  timeOutline,
  warningOutline,
  downloadOutline,
  linkOutline,
  informationCircleOutline,
  refreshOutline,
  businessOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  useI18n,
  useTranslationWithNamespace,
} from "../../hooks/common/useI18n";
import { useW9Form } from "../../hooks/quickbooks/useW9Form";
import { useToast } from "../../hooks/common/useToast";

const TaxSettings: React.FC = () => {
  const history = useHistory();
  const { t } = useI18n();
  const { t: tTax } = useTranslationWithNamespace("tax");
  const { showToast } = useToast();
  const { w9Status, isLoadingStatus, downloadPDF, isDownloading } = useW9Form();

  const [showQuickBooksAlert, setShowQuickBooksAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle W-9 form actions
   */
  const handleW9Action = (action: "start" | "continue" | "review") => {
    switch (action) {
      case "start":
      case "continue":
        history.push("/quickbooks/w9-form");
        break;
      case "review":
        history.push("/quickbooks/w9-status");
        break;
    }
  };

  /**
   * Handle PDF download
   */
  const handleDownloadPDF = async () => {
    try {
      await downloadPDF();
    } catch (error) {
      showToast(
        tTax("downloadError", "Failed to download W-9 PDF. Please try again."),
        "error",
      );
    }
  };

  /**
   * Handle viewing payment history
   */
  const handleViewPaymentHistory = () => {
    if (mockQuickBooksStatus.connected) {
      // Navigate to payment history page
      history.push("/profile/payment-history");
    } else {
      setShowQuickBooksAlert(true);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async (event: CustomEvent) => {
    setRefreshing(true);
    try {
      // Refresh W-9 status and other data
      // This would typically refetch data from the API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
      event.detail.complete();
    }
  };

  /**
   * Get W-9 status color
   */
  const getW9StatusColor = (status?: string): string => {
    switch (status) {
      case "approved":
        return "success";
      case "submitted":
        return "warning";
      case "draft":
        return "medium";
      case "rejected":
        return "danger";
      default:
        return "medium";
    }
  };

  /**
   * Get W-9 status icon
   */
  const getW9StatusIcon = (status?: string): string => {
    switch (status) {
      case "approved":
        return checkmarkCircleOutline;
      case "submitted":
        return timeOutline;
      case "rejected":
        return warningOutline;
      default:
        return documentTextOutline;
    }
  };

  /**
   * Get W-9 action button text
   */
  const getW9ActionText = (status?: string): string => {
    switch (status) {
      case "approved":
        return tTax("w9.review", "Review W-9 Form");
      case "submitted":
        return tTax("w9.viewStatus", "View Status");
      case "draft":
        return tTax("w9.continue", "Continue W-9 Form");
      case "rejected":
        return tTax("w9.resubmit", "Resubmit W-9 Form");
      default:
        return tTax("w9.start", "Start W-9 Form");
    }
  };

  // Mock QuickBooks status - in real app, this would come from API
  const mockQuickBooksStatus = {
    connected: true, // Business owner has connected their QuickBooks
    companyName: "Bounce House Rentals LLC",
    lastSync: new Date("2024-12-01"),
    contractorSynced: true, // Contractor exists as vendor in QuickBooks
    paymentTrackingActive: true,
  };

  // Mock earnings data for tax threshold calculation
  const mockEarnings = {
    currentYearEarnings: 450.75,
    threshold: 600,
  };

  const earningsProgress =
    (mockEarnings.currentYearEarnings / mockEarnings.threshold) * 100;
  const isNearThreshold = earningsProgress > 75;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>{tTax("settings.title", "Tax Settings")}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => window.location.reload()}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="p-4 space-y-6">
          {/* Tax Compliance Overview */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon
                  icon={informationCircleOutline}
                  className="mr-2 text-blue-600"
                />
                {tTax("overview.title", "Tax Compliance Overview")}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-4">
                {/* Earnings Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {tTax("earnings.currentYear", "Current Year Earnings")}
                    </span>
                    <span className="text-sm font-bold">
                      ${mockEarnings.currentYearEarnings.toFixed(2)} / $
                      {mockEarnings.threshold}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isNearThreshold ? "bg-orange-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(earningsProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {isNearThreshold
                      ? tTax(
                          "earnings.nearThreshold",
                          "You're approaching the $600 tax reporting threshold",
                        )
                      : tTax(
                          "earnings.belowThreshold",
                          "W-9 form will be required when you reach $600 in earnings",
                        )}
                  </p>
                </div>

                {/* Compliance Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IonIcon
                      icon={
                        w9Status?.status === "approved"
                          ? checkmarkCircleOutline
                          : warningOutline
                      }
                      className={`mr-2 ${w9Status?.status === "approved" ? "text-green-600" : "text-orange-600"}`}
                    />
                    <span className="font-medium">
                      {w9Status?.status === "approved"
                        ? tTax("compliance.ready", "Tax Compliant")
                        : tTax("compliance.pending", "Action Required")}
                    </span>
                  </div>
                  <IonBadge color={getW9StatusColor(w9Status?.status)}>
                    {w9Status?.status === "approved"
                      ? tTax("status.complete", "Complete")
                      : w9Status?.status === "submitted"
                        ? tTax("status.pending", "Pending")
                        : w9Status?.status === "draft"
                          ? tTax("status.draft", "Draft")
                          : tTax("status.notStarted", "Not Started")}
                  </IonBadge>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* W-9 Form Management */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon
                  icon={documentTextOutline}
                  className="mr-2 text-blue-600"
                />
                {tTax("w9.title", "W-9 Tax Form")}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {isLoadingStatus ? (
                <div className="text-center py-4">
                  <IonSpinner />
                  <p className="text-sm text-gray-600 mt-2">
                    {tTax("loading", "Loading tax information...")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* W-9 Status */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <IonIcon
                        icon={getW9StatusIcon(w9Status?.status)}
                        className={`mr-3 text-xl ${
                          w9Status?.status === "approved"
                            ? "text-green-600"
                            : w9Status?.status === "submitted"
                              ? "text-orange-600"
                              : w9Status?.status === "rejected"
                                ? "text-red-600"
                                : "text-gray-600"
                        }`}
                      />
                      <div>
                        <h3 className="font-medium">
                          {w9Status?.businessName ||
                            tTax("w9.form", "W-9 Tax Form")}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {w9Status?.status === "approved" &&
                            w9Status?.approvedAt &&
                            tTax(
                              "w9.approvedOn",
                              `Approved on ${new Date(w9Status.approvedAt).toLocaleDateString()}`,
                            )}
                          {w9Status?.status === "submitted" &&
                            w9Status?.submittedAt &&
                            tTax(
                              "w9.submittedOn",
                              `Submitted on ${new Date(w9Status.submittedAt).toLocaleDateString()}`,
                            )}
                          {w9Status?.status === "rejected" &&
                            w9Status?.rejectedAt &&
                            tTax(
                              "w9.rejectedOn",
                              `Rejected on ${new Date(w9Status.rejectedAt).toLocaleDateString()}`,
                            )}
                          {!w9Status?.status &&
                            tTax("w9.notStarted", "Not yet started")}
                        </p>
                        {w9Status?.status === "rejected" &&
                          w9Status?.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              {tTax("w9.rejectionReason", "Reason")}:{" "}
                              {w9Status.rejectionReason}
                            </p>
                          )}
                      </div>
                    </div>
                    <IonBadge color={getW9StatusColor(w9Status?.status)}>
                      {w9Status?.status === "approved"
                        ? tTax("status.approved", "Approved")
                        : w9Status?.status === "submitted"
                          ? tTax("status.submitted", "Submitted")
                          : w9Status?.status === "draft"
                            ? tTax("status.draft", "Draft")
                            : w9Status?.status === "rejected"
                              ? tTax("status.rejected", "Rejected")
                              : tTax("status.notStarted", "Not Started")}
                    </IonBadge>
                  </div>

                  {/* W-9 Actions */}
                  <div className="space-y-3">
                    <IonButton
                      expand="block"
                      fill={
                        w9Status?.status === "approved" ? "outline" : "solid"
                      }
                      onClick={() =>
                        handleW9Action(
                          w9Status?.status === "approved"
                            ? "review"
                            : w9Status?.status === "draft"
                              ? "continue"
                              : "start",
                        )
                      }
                    >
                      <IonIcon icon={documentTextOutline} slot="start" />
                      {getW9ActionText(w9Status?.status)}
                    </IonButton>

                    {w9Status?.hasPdf && (
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <IonSpinner name="crescent" slot="start" />
                        ) : (
                          <IonIcon icon={downloadOutline} slot="start" />
                        )}
                        {tTax("w9.downloadPdf", "Download W-9 PDF")}
                      </IonButton>
                    )}
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* QuickBooks Integration */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon
                  icon={businessOutline}
                  className="mr-2 text-blue-600"
                />
                {tTax("quickbooks.title", "QuickBooks Integration")}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <IonIcon
                      icon={
                        mockQuickBooksStatus.connected
                          ? checkmarkCircleOutline
                          : linkOutline
                      }
                      className={`mr-3 text-xl ${mockQuickBooksStatus.connected ? "text-green-600" : "text-gray-600"}`}
                    />
                    <div>
                      <h3 className="font-medium">
                        {mockQuickBooksStatus.connected
                          ? tTax("quickbooks.connected", "Connected")
                          : tTax("quickbooks.notConnected", "Not Connected")}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockQuickBooksStatus.connected &&
                        mockQuickBooksStatus.companyName
                          ? `${mockQuickBooksStatus.companyName} - Connected by business owner`
                          : "Business owner has not connected QuickBooks yet"}
                      </p>
                    </div>
                  </div>
                  <IonBadge
                    color={
                      mockQuickBooksStatus.connected ? "success" : "medium"
                    }
                  >
                    {mockQuickBooksStatus.connected
                      ? tTax("status.connected", "Connected")
                      : tTax("status.disconnected", "Disconnected")}
                  </IonBadge>
                </div>

                {/* Payment History Actions */}
                {mockQuickBooksStatus.connected &&
                mockQuickBooksStatus.contractorSynced ? (
                  <IonButton
                    expand="block"
                    fill="solid"
                    color="primary"
                    onClick={handleViewPaymentHistory}
                  >
                    <IonIcon icon={documentTextOutline} slot="start" />
                    {tTax(
                      "quickbooks.viewPaymentHistory",
                      "View Payment History",
                    )}
                  </IonButton>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 text-center">
                      {!mockQuickBooksStatus.connected
                        ? tTax(
                            "quickbooks.waitingForBusiness",
                            "Waiting for business owner to connect QuickBooks",
                          )
                        : tTax(
                            "quickbooks.waitingForSync",
                            "Waiting for vendor sync to complete",
                          )}
                    </p>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Tax Documents */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon
                  icon={documentTextOutline}
                  className="mr-2 text-blue-600"
                />
                {tTax("documents.title", "Tax Documents")}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {w9Status?.hasPdf ? (
                  <IonItem button onClick={handleDownloadPDF}>
                    <IonIcon icon={documentTextOutline} slot="start" />
                    <IonLabel>
                      <h3>{tTax("documents.w9Form", "W-9 Tax Form")}</h3>
                      <p>
                        {tTax(
                          "documents.w9Description",
                          "Current tax year W-9 form",
                        )}
                      </p>
                    </IonLabel>
                    <IonIcon icon={downloadOutline} slot="end" />
                  </IonItem>
                ) : (
                  <IonItem>
                    <IonIcon
                      icon={documentTextOutline}
                      slot="start"
                      color="medium"
                    />
                    <IonLabel>
                      <h3>
                        {tTax(
                          "documents.noDocuments",
                          "No Documents Available",
                        )}
                      </h3>
                      <p>
                        {tTax(
                          "documents.completeW9",
                          "Complete your W-9 form to access tax documents",
                        )}
                      </p>
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Help & Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon
                  icon={informationCircleOutline}
                  className="mr-2 text-blue-600"
                />
                {tTax("help.title", "Tax Information & Help")}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {tTax("help.w9Required", "When is W-9 Required?")}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {tTax(
                      "help.w9Description",
                      "You must complete a W-9 form before earning $600 in a calendar year. This ensures proper tax reporting and compliance with IRS regulations.",
                    )}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    {tTax("help.benefits", "Benefits of Early Completion")}
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>
                      • {tTax("help.benefit1", "Faster payment processing")}
                    </li>
                    <li>
                      • {tTax("help.benefit2", "Access to higher-paying tasks")}
                    </li>
                    <li>
                      • {tTax("help.benefit3", "Automated tax reporting")}
                    </li>
                    <li>
                      •{" "}
                      {tTax("help.benefit4", "Professional profile completion")}
                    </li>
                  </ul>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  href="https://www.irs.gov/forms-pubs/about-form-w-9"
                  target="_blank"
                >
                  <IonIcon icon={informationCircleOutline} slot="start" />
                  {tTax("help.learnMore", "Learn More About W-9 Forms")}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* QuickBooks Connection Alert */}
        <IonAlert
          isOpen={showQuickBooksAlert}
          onDidDismiss={() => setShowQuickBooksAlert(false)}
          header={tTax("quickbooks.alertTitle", "QuickBooks Integration")}
          message={tTax(
            "quickbooks.alertMessage",
            "QuickBooks integration is coming soon. This feature will allow automatic tax reporting and streamlined payment processing.",
          )}
          buttons={[
            {
              text: t("app.ok", "OK"),
              role: "cancel",
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TaxSettings;
