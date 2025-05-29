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

const MyTasks: React.FC = () => {
  const handleRefresh = (event: CustomEvent) => {
    setTimeout(() => {
      event.detail.complete();
    }, 2000);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Tasks</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-heading mb-2">My Tasks</h2>
            <IonText className="text-body">
              View and manage your assigned tasks, track progress, and update
              status.
            </IonText>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <IonText className="text-caption">
                🚧 This feature is coming soon! You'll be able to manage your
                tasks here.
              </IonText>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyTasks;
