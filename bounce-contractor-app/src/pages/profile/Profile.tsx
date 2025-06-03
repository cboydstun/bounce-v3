import React from "react";
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
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { useI18n } from "../../hooks/common/useI18n";
import { useW9Form } from "../../hooks/quickbooks/useW9Form";
import EarningsSummary from "../../components/tasks/EarningsSummary";

const Profile: React.FC = () => {
  const history = useHistory();
  const { t } = useI18n();
  const user = useAuthStore(authSelectors.user);
  const profile = useAuthStore(authSelectors.profile);
  const logout = useAuthStore((state) => state.logout);
  const { w9Status } = useW9Form();

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
    // TODO: Navigate to earnings details page
    console.log("View earnings details");
  };

  const handleViewPaymentHistory = () => {
    // TODO: Navigate to payment history page
    console.log("View payment history");
  };

  // Mock earnings data - in real app, this would come from API
  const mockEarnings = {
    totalEarnings: 2450.75,
    thisWeekEarnings: 325.5,
    thisMonthEarnings: 1250.25,
    completedTasks: 18,
    averagePerTask: 136.15,
    pendingPayments: 175.0,
    lastPaymentDate: "2025-05-25",
    nextPaymentDate: "2025-06-01",
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
              earnings={mockEarnings}
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
            >
              {t("profile.helpSupport")}
            </IonButton>

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
    </IonPage>
  );
};

export default Profile;
