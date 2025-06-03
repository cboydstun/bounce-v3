/**
 * W9FormPage Component
 *
 * Main page for W-9 form submission. Provides entry point to the
 * W-9 form wizard with proper navigation and state management.
 */

import React from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import {
  documentTextOutline,
  shieldCheckmarkOutline,
  timeOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useI18n } from "../../hooks/common/useI18n";
import { useW9FormStatus } from "../../hooks/quickbooks/useW9Form";
import W9FormWizard from "../../components/quickbooks/W9Form/W9FormWizard";

/**
 * W9FormPage Component
 *
 * Features:
 * - W-9 form status display
 * - Entry point to form wizard
 * - Progress tracking
 * - Security information
 * - Responsive design
 */
const W9FormPage: React.FC = () => {
  const history = useHistory();
  const { t } = useI18n();
  const { w9Status, isLoading, error } = useW9FormStatus();

  /**
   * Handle starting the W-9 form
   */
  const handleStartForm = () => {
    // The wizard is embedded in this page, so we just need to show it
    // In a more complex implementation, this might navigate to a separate route
  };

  /**
   * Get status display information
   */
  const getStatusInfo = () => {
    if (!w9Status) {
      return {
        icon: documentTextOutline,
        title: t("quickbooks.w9.notStarted", "W-9 Form Not Started"),
        description: t(
          "quickbooks.w9.notStartedDesc",
          "Complete your W-9 tax form to enable payment processing",
        ),
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        canEdit: true,
      };
    }

    switch (w9Status.status) {
      case "draft":
        return {
          icon: timeOutline,
          title: t("quickbooks.w9.draftStatus", "W-9 Form Draft"),
          description: t(
            "quickbooks.w9.draftDesc",
            "Your W-9 form is saved as a draft. Complete and submit it to enable payments.",
          ),
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          canEdit: true,
        };

      case "submitted":
        return {
          icon: timeOutline,
          title: t("quickbooks.w9.submittedStatus", "W-9 Form Submitted"),
          description: t(
            "quickbooks.w9.submittedDesc",
            "Your W-9 form has been submitted and is under review.",
          ),
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          canEdit: false,
        };

      case "approved":
        return {
          icon: checkmarkCircleOutline,
          title: t("quickbooks.w9.approvedStatus", "W-9 Form Approved"),
          description: t(
            "quickbooks.w9.approvedDesc",
            "Your W-9 form has been approved. You can now receive payments.",
          ),
          color: "text-green-600",
          bgColor: "bg-green-50",
          canEdit: false,
        };

      case "rejected":
        return {
          icon: documentTextOutline,
          title: t("quickbooks.w9.rejectedStatus", "W-9 Form Rejected"),
          description: t(
            "quickbooks.w9.rejectedDesc",
            "Your W-9 form was rejected. Please review and resubmit.",
          ),
          color: "text-red-600",
          bgColor: "bg-red-50",
          canEdit: true,
        };

      default:
        return {
          icon: documentTextOutline,
          title: t("quickbooks.w9.unknownStatus", "Unknown Status"),
          description: t("quickbooks.w9.unknownDesc", "Please contact support"),
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          canEdit: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // If we have a form that can be edited, show the wizard
  if (statusInfo.canEdit) {
    return <W9FormWizard onClose={() => history.goBack()} />;
  }

  // Otherwise, show the status page
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>{t("quickbooks.w9.pageTitle", "W-9 Tax Form")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="max-w-2xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <IonCard>
              <IonCardContent className="text-center py-8">
                <IonSpinner name="crescent" className="mb-4" />
                <p className="text-gray-600">
                  {t("quickbooks.w9.loadingStatus", "Loading W-9 status...")}
                </p>
              </IonCardContent>
            </IonCard>
          )}

          {/* Error State */}
          {error && (
            <IonCard className="border-l-4 border-l-red-500">
              <IonCardContent>
                <div className="flex items-start">
                  <IonIcon
                    icon={documentTextOutline}
                    className="text-red-500 mr-3 mt-1 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t(
                        "quickbooks.w9.errorTitle",
                        "Error Loading W-9 Status",
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {error.message ||
                        t(
                          "quickbooks.w9.errorDesc",
                          "Unable to load W-9 form status",
                        )}
                    </p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Status Display */}
          {!isLoading && !error && (
            <>
              {/* Current Status */}
              <IonCard className={`border-l-4 ${statusInfo.bgColor}`}>
                <IonCardContent>
                  <div className="flex items-start">
                    <IonIcon
                      icon={statusInfo.icon}
                      className={`${statusInfo.color} mr-3 mt-1 flex-shrink-0 text-xl`}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {statusInfo.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {statusInfo.description}
                      </p>

                      {/* Additional Status Information */}
                      {w9Status && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              {t("quickbooks.w9.businessName", "Business Name")}
                              :
                            </span>
                            <span className="font-medium">
                              {w9Status.businessName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              {t(
                                "quickbooks.w9.taxClassification",
                                "Tax Classification",
                              )}
                              :
                            </span>
                            <span className="font-medium capitalize">
                              {w9Status.taxClassification.replace("-", " ")}
                            </span>
                          </div>
                          {w9Status.submittedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("quickbooks.w9.submittedDate", "Submitted")}:
                              </span>
                              <span className="font-medium">
                                {new Date(
                                  w9Status.submittedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {w9Status.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-800">
                                <strong>
                                  {t(
                                    "quickbooks.w9.rejectionReason",
                                    "Rejection Reason",
                                  )}
                                  :
                                </strong>
                                <br />
                                {w9Status.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Action Buttons */}
              {statusInfo.canEdit && (
                <IonCard>
                  <IonCardContent>
                    <IonButton
                      expand="block"
                      onClick={handleStartForm}
                      className="mb-4"
                    >
                      <IonIcon icon={documentTextOutline} slot="start" />
                      {w9Status?.status === "draft"
                        ? t("quickbooks.w9.continueForm", "Continue W-9 Form")
                        : t("quickbooks.w9.startForm", "Start W-9 Form")}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Information Cards */}
              <div className="space-y-4 mt-6">
                {/* Security Information */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center text-base">
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="mr-2 text-green-600"
                      />
                      {t("quickbooks.w9.securityTitle", "Security & Privacy")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {t(
                          "quickbooks.w9.securityPoint1",
                          "All tax information is encrypted before transmission",
                        )}
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {t(
                          "quickbooks.w9.securityPoint2",
                          "Data is stored securely and used only for tax reporting",
                        )}
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {t(
                          "quickbooks.w9.securityPoint3",
                          "Compliant with IRS requirements and privacy regulations",
                        )}
                      </li>
                    </ul>
                  </IonCardContent>
                </IonCard>

                {/* What is W-9 Information */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center text-base">
                      <IonIcon
                        icon={documentTextOutline}
                        className="mr-2 text-blue-600"
                      />
                      {t("quickbooks.w9.whatIsTitle", "What is a W-9 Form?")}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {t(
                        "quickbooks.w9.whatIsDesc",
                        "A W-9 form is an IRS document that provides your tax identification information to businesses that pay you. It's required for:",
                      )}
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {t(
                          "quickbooks.w9.purpose1",
                          "Receiving payments for contractor work",
                        )}
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {t(
                          "quickbooks.w9.purpose2",
                          "Proper tax reporting and 1099 generation",
                        )}
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {t(
                          "quickbooks.w9.purpose3",
                          "Compliance with IRS regulations",
                        )}
                      </li>
                    </ul>
                  </IonCardContent>
                </IonCard>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default W9FormPage;
