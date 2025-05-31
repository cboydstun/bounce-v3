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

const Profile: React.FC = () => {
  const history = useHistory();
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="p-4">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
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
              <IonText className="text-caption">Total Jobs</IonText>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {profile?.rating || 0}
              </div>
              <IonText className="text-caption">Rating</IonText>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">
                {profile?.completionRate || 0}%
              </div>
              <IonText className="text-caption">Completion</IonText>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="space-y-4">
            <IonButton
              expand="block"
              fill="outline"
              className="border-primary text-primary"
            >
              <IonIcon icon={settingsOutline} slot="start" />
              Edit Profile
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-gray-300 text-gray-600"
              onClick={handleSettings}
            >
              <IonIcon icon={settingsOutline} slot="start" />
              Notification Settings
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="border-gray-300 text-gray-600"
            >
              Help & Support
            </IonButton>

            <IonButton
              expand="block"
              color="danger"
              fill="outline"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Sign Out
            </IonButton>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <IonText className="text-caption">
              🚧 Full profile management features are coming soon!
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
