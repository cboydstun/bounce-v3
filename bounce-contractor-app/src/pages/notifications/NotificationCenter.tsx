import React from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonRefresher,
  IonRefresherContent,
  IonText,
} from "@ionic/react";
import { useNotificationTranslation } from "../../hooks/common/useI18n";

const NotificationCenter: React.FC = () => {
  const { t } = useNotificationTranslation();

  const handleRefresh = (event: CustomEvent) => {
    setTimeout(() => {
      event.detail.complete();
    }, 2000);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("center.title")}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h2 className="text-heading mb-2">{t("center.title")}</h2>
            <IonText className="text-body">{t("center.stayUpdated")}</IonText>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <IonText className="text-caption">
                {t("center.comingSoon")}
              </IonText>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationCenter;
