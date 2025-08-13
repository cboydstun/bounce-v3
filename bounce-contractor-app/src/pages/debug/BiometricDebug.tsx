import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import BiometricDebugPanel from "../../components/debug/BiometricDebugPanel";

const BiometricDebug: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Biometric Debug</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <BiometricDebugPanel isOpen={true} onDidDismiss={() => {}} />
      </IonContent>
    </IonPage>
  );
};

export default BiometricDebug;
