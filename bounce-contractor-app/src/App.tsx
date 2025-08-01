import React, { useEffect, Suspense, lazy } from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonSpinner,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import {
  listOutline,
  checkboxOutline,
  personOutline,
  notificationsOutline,
} from "ionicons/icons";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Ionic Dark Mode */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";

/* Tailwind CSS */
import "./theme/tailwind.css";

/* Lazy-loaded Pages */
// Task Pages
const AvailableTasks = lazy(() => import("./pages/tasks/AvailableTasks"));
const MyTasks = lazy(() => import("./pages/tasks/MyTasks"));
const TaskDetails = lazy(() => import("./pages/tasks/TaskDetails"));
const TaskCompletion = lazy(() => import("./pages/tasks/TaskCompletion"));

// Profile Pages
const Profile = lazy(() => import("./pages/profile/Profile"));
const EditProfile = lazy(() => import("./pages/profile/EditProfile"));
const TaxSettings = lazy(() => import("./pages/profile/TaxSettings"));

// Earnings Pages
const PaymentHistory = lazy(() => import("./pages/earnings/PaymentHistory"));
const EarningsDetails = lazy(() => import("./pages/earnings/EarningsDetails"));

// Notification Pages
const NotificationCenter = lazy(
  () => import("./pages/notifications/NotificationCenter"),
);
const NotificationSettings = lazy(
  () => import("./pages/notifications/NotificationSettings"),
);

// Auth Pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Splash = lazy(() => import("./pages/auth/Splash"));

// QuickBooks Pages
const W9FormPage = lazy(() => import("./pages/quickbooks/W9FormPage"));

/* Components - Keep critical components as static imports */
import ProtectedRoute from "./components/layout/ProtectedRoute";
import OfflineBanner from "./components/common/OfflineBanner";
import LoadingSpinner from "./components/common/LoadingSpinner";

/* Store */
import { useAuthStore, authSelectors } from "./store/authStore";

/* Utils */
import { preloadCriticalChunks } from "./utils/preloader";

/* Capacitor */
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";

setupIonicReact({
  rippleEffect: false,
  mode: "ios",
});

const App: React.FC = () => {
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Only use native plugins on mobile platforms
        if (Capacitor.isNativePlatform()) {
          // Set status bar style
          await StatusBar.setStyle({ style: Style.Light });

          // Hide splash screen
          await SplashScreen.hide();
        }

        // Check authentication status (works on all platforms)
        await checkAuthStatus();
      } catch (error) {
        console.error("App initialization error:", error);

        // Try to hide splash screen even if other operations failed
        if (Capacitor.isNativePlatform()) {
          try {
            await SplashScreen.hide();
          } catch (splashError) {
            console.error("Failed to hide splash screen:", splashError);
          }
        }
      }
    };

    initializeApp();

    // Handle app state changes
    const handleAppStateChange = (state: any) => {
      if (state.isActive && isAuthenticated) {
        // App became active, check auth status
        checkAuthStatus();
      }
    };

    CapacitorApp.addListener("appStateChange", handleAppStateChange);

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [checkAuthStatus, isAuthenticated]);

  // Preload critical chunks after authentication
  useEffect(() => {
    if (isAuthenticated) {
      preloadCriticalChunks();
    }
  }, [isAuthenticated]);

  // Loading fallback component
  const LoadingFallback = () => <LoadingSpinner message="Loading page..." />;

  if (!isAuthenticated) {
    return (
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet className="pt-0">
            <Route exact path="/splash">
              <Suspense fallback={<LoadingFallback />}>
                <Splash />
              </Suspense>
            </Route>
            <Route exact path="/login">
              <Suspense fallback={<LoadingFallback />}>
                <Login />
              </Suspense>
            </Route>
            <Route exact path="/register">
              <Suspense fallback={<LoadingFallback />}>
                <Register />
              </Suspense>
            </Route>
            <Route exact path="/">
              <Redirect to="/splash" />
            </Route>
            <Route>
              <Redirect to="/splash" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <OfflineBanner className="fixed top-0 left-0 right-0 z-50" />
        <IonTabs>
          <IonRouterOutlet className="pt-0">
            <ProtectedRoute exact path="/available-tasks">
              <Suspense fallback={<LoadingFallback />}>
                <AvailableTasks />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/my-tasks">
              <Suspense fallback={<LoadingFallback />}>
                <MyTasks />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/task-details/:id">
              <Suspense fallback={<LoadingFallback />}>
                <TaskDetails />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/tasks/:id/complete">
              <Suspense fallback={<LoadingFallback />}>
                <TaskCompletion />
              </Suspense>
            </ProtectedRoute>

            <ProtectedRoute exact path="/profile">
              <Suspense fallback={<LoadingFallback />}>
                <Profile />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/profile/edit">
              <Suspense fallback={<LoadingFallback />}>
                <EditProfile />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/profile/tax-settings">
              <Suspense fallback={<LoadingFallback />}>
                <TaxSettings />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/profile/payment-history">
              <Suspense fallback={<LoadingFallback />}>
                <PaymentHistory />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/profile/earnings-details">
              <Suspense fallback={<LoadingFallback />}>
                <EarningsDetails />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/notifications">
              <Suspense fallback={<LoadingFallback />}>
                <NotificationCenter />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/notifications/settings">
              <Suspense fallback={<LoadingFallback />}>
                <NotificationSettings />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/quickbooks/w9-form">
              <Suspense fallback={<LoadingFallback />}>
                <W9FormPage />
              </Suspense>
            </ProtectedRoute>
            <ProtectedRoute exact path="/">
              <Redirect to="/available-tasks" />
            </ProtectedRoute>
            <ProtectedRoute>
              <Redirect to="/available-tasks" />
            </ProtectedRoute>
          </IonRouterOutlet>

          <IonTabBar
            slot="bottom"
            className="bg-white border-t border-gray-200"
          >
            <IonTabButton tab="available-tasks" href="/available-tasks">
              <IonIcon
                aria-hidden="true"
                icon={listOutline}
                className="text-primary"
              />
              <IonLabel className="text-sm font-medium">Available</IonLabel>
            </IonTabButton>

            <IonTabButton tab="my-tasks" href="/my-tasks">
              <IonIcon
                aria-hidden="true"
                icon={checkboxOutline}
                className="text-primary"
              />
              <IonLabel className="text-sm font-medium">My Tasks</IonLabel>
            </IonTabButton>

            <IonTabButton tab="notifications" href="/notifications">
              <IonIcon
                aria-hidden="true"
                icon={notificationsOutline}
                className="text-primary"
              />
              <IonLabel className="text-sm font-medium">Alerts</IonLabel>
            </IonTabButton>

            <IonTabButton tab="profile" href="/profile">
              <IonIcon
                aria-hidden="true"
                icon={personOutline}
                className="text-primary"
              />
              <IonLabel className="text-sm font-medium">Profile</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
