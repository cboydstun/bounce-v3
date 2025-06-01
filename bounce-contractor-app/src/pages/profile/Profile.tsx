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
} from "@ionic/react";
import { logOutOutline, settingsOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { useI18n } from "../../hooks/common/useI18n";

const Profile: React.FC = () => {
  const history = useHistory();
  const { t } = useI18n();
  const user = useAuthStore(authSelectors.user);
  const profile = useAuthStore(authSelectors.profile);
  const logout = useAuthStore((state) => state.logout);

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

  const handleEditProfile = () => {
    history.push("/profile/edit");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('common.navigation.profile')}</IonTitle>
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

          {/* Profile Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {profile?.totalJobs || 0}
              </div>
              <IonText className="text-caption">{t('common.profile.totalJobs')}</IonText>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {profile?.rating || 0}
              </div>
              <IonText className="text-caption">{t('common.profile.rating')}</IonText>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {profile?.completionRate || 0}%
              </div>
              <IonText className="text-caption">{t('common.profile.completion')}</IonText>
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
              {t('common.profile.editProfile')}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-gray-300 text-gray-600"
              onClick={handleSettings}
            >
              <IonIcon icon={settingsOutline} slot="start" />
              {t('common.profile.notificationSettings')}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-gray-300 text-gray-600"
            >
              {t('common.profile.helpSupport')}
            </IonButton>

            <IonButton
              expand="block"
              color="danger"
              fill="outline"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              {t('common.profile.signOut')}
            </IonButton>
          </div>


        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
