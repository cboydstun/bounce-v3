import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { AudioAlertsDemo } from "../components/AudioAlertsDemo";

const AudioTestPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Audio Alerts Test</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Audio Alerts Test</IonTitle>
          </IonToolbar>
        </IonHeader>
        <AudioAlertsDemo className="ion-padding" />
      </IonContent>
    </IonPage>
  );
};

export default AudioTestPage;
