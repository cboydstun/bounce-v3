import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { IonContent, IonPage, IonSpinner } from "@ionic/react";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { useNotificationSystem } from "../../hooks/notifications/useNotificationSystem";
import { APP_CONFIG } from "../../config/app.config";

const Splash: React.FC = () => {
  const history = useHistory();
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingStage, setLoadingStage] = useState<
    "auth" | "notifications" | "workspace" | "ready"
  >("auth");
  const [initializationStatus, setInitializationStatus] = useState<{
    auth: boolean;
    notifications: boolean;
    error?: string;
  }>({
    auth: false,
    notifications: false,
  });

  // Check if user has enabled notifications in their previous settings
  const shouldInitializeNotifications = () => {
    try {
      const stored = localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.SYSTEM_INITIALIZATION_STATE,
      );
      if (stored) {
        const state = JSON.parse(stored);
        return state.masterEnabled || state.audioEnabled || state.pushEnabled;
      }
    } catch (error) {
      console.error("Failed to check notification settings:", error);
    }
    // Default to true for first-time users to ensure notifications are ready
    return true;
  };

  // Initialize notification system with user's preferences
  const notificationSystem = useNotificationSystem({
    autoInitialize: shouldInitializeNotifications(),
    autoRequestPermissions: false, // Don't auto-request permissions on splash
    enableAudioAlerts: true,
    enablePushNotifications: true,
    preloadSounds: true,
  });

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setIsLoaded(true), 100);

    const initializeApp = async () => {
      try {
        // Stage 1: Authentication
        setLoadingStage("auth");
        const isValid = await checkAuthStatus();
        setInitializationStatus((prev) => ({ ...prev, auth: true }));

        // Stage 2: Notifications (if enabled)
        if (shouldInitializeNotifications()) {
          setLoadingStage("notifications");
          try {
            // Give the notification system time to initialize
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Check if at least one system is working (lenient success criteria)
            const audioWorking =
              notificationSystem.audioAlerts.isSupported &&
              !notificationSystem.audioAlerts.error;
            const pushWorking =
              notificationSystem.pushNotifications.isSupported &&
              !notificationSystem.pushNotifications.error;

            if (audioWorking || pushWorking) {
              console.log("Notification system initialized successfully", {
                audio: audioWorking,
                push: pushWorking,
              });
              setInitializationStatus((prev) => ({
                ...prev,
                notifications: true,
              }));
            } else {
              console.warn(
                "Notification system initialization had issues, but continuing",
              );
              setInitializationStatus((prev) => ({
                ...prev,
                notifications: true, // Still mark as complete to not block app
                error: "Notifications may not be fully functional",
              }));
            }
          } catch (error) {
            console.error("Notification system initialization failed:", error);
            setInitializationStatus((prev) => ({
              ...prev,
              notifications: true, // Don't block app startup
              error: "Notification setup failed",
            }));
          }
        } else {
          // Skip notification initialization
          setInitializationStatus((prev) => ({ ...prev, notifications: true }));
        }

        // Stage 3: Workspace preparation
        setLoadingStage("workspace");
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Stage 4: Ready
        setLoadingStage("ready");
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Navigate to appropriate screen
        setTimeout(() => {
          if (isValid) {
            history.replace("/tasks/available");
          } else {
            history.replace("/login");
          }
        }, 500);
      } catch (error) {
        console.error("App initialization failed:", error);
        setInitializationStatus((prev) => ({
          ...prev,
          error: "Initialization failed",
        }));
        setTimeout(() => {
          history.replace("/login");
        }, 1500);
      }
    };

    initializeApp();
  }, [
    checkAuthStatus,
    history,
    notificationSystem.audioAlerts.isSupported,
    notificationSystem.audioAlerts.error,
    notificationSystem.pushNotifications.isSupported,
    notificationSystem.pushNotifications.error,
  ]);

  // Get loading text based on current stage
  const getLoadingText = () => {
    switch (loadingStage) {
      case "auth":
        return "Authenticating...";
      case "notifications":
        return "Setting up notifications...";
      case "workspace":
        return "Preparing workspace...";
      case "ready":
        return "Ready!";
      default:
        return "Initializing...";
    }
  };

  const getLoadingSubtext = () => {
    switch (loadingStage) {
      case "auth":
        return "Verifying your credentials";
      case "notifications":
        return "Configuring audio alerts and push notifications";
      case "workspace":
        return "Loading your personalized dashboard";
      case "ready":
        return "Welcome back!";
      default:
        return "Setting up your workspace";
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Animated Background */}
        <div className="relative h-full overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-secondary">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated Circles */}
            <div
              className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-bounce"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            ></div>
            <div
              className="absolute top-40 right-16 w-24 h-24 bg-secondary/20 rounded-full animate-bounce"
              style={{ animationDelay: "1s", animationDuration: "4s" }}
            ></div>
            <div
              className="absolute bottom-32 left-20 w-20 h-20 bg-white/15 rounded-full animate-bounce"
              style={{ animationDelay: "2s", animationDuration: "3.5s" }}
            ></div>
            <div
              className="absolute bottom-20 right-10 w-16 h-16 bg-secondary/25 rounded-full animate-bounce"
              style={{ animationDelay: "0.5s", animationDuration: "2.8s" }}
            ></div>

            {/* Geometric Shapes */}
            <div className="absolute top-1/3 right-8 w-12 h-12 bg-white/10 transform rotate-45 animate-pulse"></div>
            <div
              className="absolute bottom-1/3 left-12 w-8 h-8 bg-secondary/20 transform rotate-12 animate-pulse"
              style={{ animationDelay: "1.5s" }}
            ></div>
          </div>

          {/* Main Content */}
          <div
            className={`relative z-10 flex flex-col items-center justify-center h-full transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {/* Logo Section */}
            <div
              className={`text-center mb-8 transition-all duration-1000 delay-300 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              {/* Enhanced Logo */}
              <div className="relative mb-6">
                {/* Logo Background with Glow */}
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-white to-gray-100 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>

                  {/* Logo Content */}
                  <div className="relative z-10 text-center">
                    {/* Truck Icon */}
                    <div className="text-primary mb-1">
                      <svg
                        className="w-12 h-12 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                      </svg>
                    </div>
                    {/* App Initials */}
                    <div className="text-2xl font-bold text-primary">BC</div>
                  </div>

                  {/* Animated Ring */}
                  <div className="absolute inset-0 rounded-3xl border-4 border-secondary/30 animate-ping"></div>
                </div>

                {/* Bounce House Icon */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16.21 2.76.21 3.91 0 5.16-1 9-5.45 9-11V7l-10-5z" />
                  </svg>
                </div>
              </div>

              {/* App Name */}
              <h1 className="text-4xl font-bold text-white mb-3 tracking-wide">
                {APP_CONFIG.APP_NAME}
              </h1>

              {/* Tagline */}
              <div className="px-6 mb-2">
                <p className="text-white/90 text-lg font-medium">
                  {APP_CONFIG.APP_DESCRIPTION}
                </p>
                <p className="text-white/70 text-sm mt-1 italic">
                  Delivering smiles, one bounce at a time
                </p>
              </div>
            </div>

            {/* Loading Section */}
            <div
              className={`text-center transition-all duration-1000 delay-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              {/* Enhanced Loading Spinner */}
              <div className="relative mb-6">
                <div className="flex justify-center">
                  <IonSpinner
                    name="crescent"
                    className="w-10 h-10 text-white"
                  />
                </div>
                {/* Loading Ring */}
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-16 h-16 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="flex justify-center space-x-2 mb-4">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    initializationStatus.auth ? "bg-white" : "bg-white/30"
                  }`}
                ></div>
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    initializationStatus.notifications
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                ></div>
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    loadingStage === "workspace" || loadingStage === "ready"
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                ></div>
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    loadingStage === "ready" ? "bg-white" : "bg-white/30"
                  }`}
                ></div>
              </div>

              {/* Loading Text */}
              <p className="text-white/80 text-base font-medium mb-2">
                {getLoadingText()}
              </p>
              <p className="text-white/60 text-sm">{getLoadingSubtext()}</p>

              {/* Error Display */}
              {initializationStatus.error && (
                <p className="text-red-300 text-xs mt-2 italic">
                  {initializationStatus.error}
                </p>
              )}
            </div>

            {/* Feature Highlights */}
            <div
              className={`mt-8 transition-all duration-1000 delay-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="flex justify-center space-x-8 text-white/70">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 bg-white/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <p className="text-xs">Tasks</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 bg-white/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <p className="text-xs">Tracking</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 bg-white/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                    </svg>
                  </div>
                  <p className="text-xs">Earnings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div
            className={`absolute bottom-6 left-0 right-0 text-center transition-all duration-1000 delay-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mx-auto inline-block">
              <p className="text-white/60 text-xs font-medium">
                Version {APP_CONFIG.APP_VERSION} • Professional Edition
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
