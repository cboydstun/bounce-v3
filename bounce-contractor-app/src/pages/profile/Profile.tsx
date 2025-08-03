import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonText,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import {
  logOutOutline,
  settingsOutline,
  documentTextOutline,
  bugOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { useI18n } from "../../hooks/common/useI18n";
import { useW9Form } from "../../hooks/quickbooks/useW9Form";
import EarningsSummary from "../../components/tasks/EarningsSummary";
import { useEarnings } from "../../hooks/tasks/useEarnings";
import HelpSupportModal from "../../components/support/HelpSupportModal";

const Profile: React.FC = () => {
  const history = useHistory();
  const { t } = useI18n();
  const user = useAuthStore(authSelectors.user);
  const profile = useAuthStore(authSelectors.profile);
  const logout = useAuthStore((state) => state.logout);
  const { w9Status } = useW9Form();
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get real earnings data from API
  const {
    data: earningsData,
    isLoading: earningsLoading,
    error: earningsError,
  } = useEarnings();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSettings = () => {
    history.push("/notifications/settings");
  };

  const handleTaxSettings = () => {
    history.push("/profile/tax-settings");
  };

  const handleEditProfile = () => {
    history.push("/profile/edit");
  };

  const handleViewEarningsDetails = () => {
    history.push("/profile/earnings-details");
  };

  const handleViewPaymentHistory = () => {
    history.push("/profile/payment-history");
  };

  const handleDebugBiometric = () => {
    history.push("/debug/biometric");
  };

  // Check if we're in development mode
  const isDevelopment = import.meta.env.MODE === "development";

  // Fallback earnings data if API fails
  const fallbackEarnings = {
    totalEarnings: 0,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0,
    completedTasks: 0,
    averagePerTask: 0,
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("navigation.profile")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="p-4">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center mb-4 overflow-hidden">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              )}
            </div>
            <h2 className="text-heading mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <IonText className="text-body">{user?.email}</IonText>
          </div>

          {/* Earnings Summary */}
          <div className="mb-8">
            <EarningsSummary
              earnings={earningsData || fallbackEarnings}
              isLoading={earningsLoading}
              onViewDetails={handleViewEarningsDetails}
              onViewPaymentHistory={handleViewPaymentHistory}
            />
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {profile?.totalJobs || 0}
              </div>
              <IonText className="text-caption">
                {t("profile.totalJobs")}
              </IonText>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {profile?.rating || 0}
              </div>
              <IonText className="text-caption">{t("profile.rating")}</IonText>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {profile?.completionRate || 0}%
              </div>
              <IonText className="text-caption">
                {t("profile.completion")}
              </IonText>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="space-y-4">
            <IonButton
              expand="block"
              fill="outline"
              className="border-primary text-primary"
              onClick={handleEditProfile}
            >
              <IonIcon icon={settingsOutline} slot="start" />
              {t("profile.editProfile")}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-blue-300 text-blue-600"
              onClick={handleTaxSettings}
            >
              <IonIcon icon={documentTextOutline} slot="start" />
              {t("profile.taxSettings", "Tax Settings")}
              <IonBadge
                color={
                  w9Status?.status === "approved"
                    ? "success"
                    : w9Status?.status === "submitted"
                      ? "warning"
                      : "medium"
                }
                slot="end"
              >
                {w9Status?.status === "approved"
                  ? t("tax.status.complete", "Complete")
                  : w9Status?.status === "submitted"
                    ? t("tax.status.pending", "Pending")
                    : w9Status?.status === "draft"
                      ? t("tax.status.draft", "Draft")
                      : t("tax.status.notStarted", "Not Started")}
              </IonBadge>
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-gray-300 text-gray-600"
              onClick={handleSettings}
            >
              <IonIcon icon={settingsOutline} slot="start" />
              {t("profile.notificationSettings")}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-gray-300 text-gray-600"
              onClick={() => setShowHelpModal(true)}
            >
              {t("profile.helpSupport")}
            </IonButton>

            {/* Debug Button - Only show in development mode */}
            {/* {isDevelopment && ( */}
            <IonButton
              expand="block"
              fill="outline"
              className="border-orange-300 text-orange-600"
              onClick={handleDebugBiometric}
            >
              <IonIcon icon={bugOutline} slot="start" />
              Biometric Debug
            </IonButton>
            {/* )} */}

            <IonButton
              expand="block"
              color="danger"
              fill="outline"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              {t("profile.signOut")}
            </IonButton>
          </div>
        </div>
      </IonContent>

      {/* Help & Support Modal */}
      <HelpSupportModal
        isOpen={showHelpModal}
        onDidDismiss={() => setShowHelpModal(false)}
      />
    </IonPage>
  );
};

export default Profile;
