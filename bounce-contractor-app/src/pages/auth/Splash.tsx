import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { IonContent, IonPage, IonSpinner } from "@ionic/react";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { APP_CONFIG } from "../../config/app.config";

const Splash: React.FC = () => {
  const history = useHistory();
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isValid = await checkAuthStatus();

        // Add a small delay for better UX
        setTimeout(() => {
          if (isValid) {
            history.replace("/tasks/available");
          } else {
            history.replace("/login");
          }
        }, 1500);
      } catch (error) {
        console.error("Auth check failed:", error);
        setTimeout(() => {
          history.replace("/login");
        }, 1500);
      }
    };

    initializeAuth();
  }, [checkAuthStatus, history]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary to-secondary">
          <div className="text-center">
            {/* App Logo */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-primary">BC</span>
              </div>
            </div>
            {/* App Name */}
            <h1 className="text-3xl font-bold text-white mb-2">
              {APP_CONFIG.APP_NAME}
            </h1>
            {/* App Description */}
            <p className="text-white/80 text-lg mb-8 px-4">
              {APP_CONFIG.APP_DESCRIPTION}
            </p>
            {/* Loading Spinner */}
            <div className="flex justify-center">
              <IonSpinner name="crescent" className="w-8 h-8 text-white" />
            </div>
            z{/* Loading Text */}
            <p className="text-white/60 text-sm mt-4">Initializing...</p>
          </div>

          {/* Version Info */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/40 text-xs">
              Version {APP_CONFIG.APP_VERSION}
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
