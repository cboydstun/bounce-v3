import React, { useEffect } from "react";
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
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

/* Pages */
import AvailableTasks from "./pages/tasks/AvailableTasks";
import MyTasks from "./pages/tasks/MyTasks";
import Profile from "./pages/profile/Profile";
import NotificationCenter from "./pages/notifications/NotificationCenter";
import NotificationSettings from "./pages/notifications/NotificationSettings";

/* Auth Pages */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Splash from "./pages/auth/Splash";

/* Components */
import ProtectedRoute from "./components/layout/ProtectedRoute";

/* Store */
import { useAuthStore, authSelectors } from "./store/authStore";

/* Capacitor */
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

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
        // Set status bar style
        await StatusBar.setStyle({ style: Style.Light });

        // Check authentication status
        await checkAuthStatus();

        // Hide splash screen
        await SplashScreen.hide();
      } catch (error) {
        console.error("App initialization error:", error);
        await SplashScreen.hide();
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

  if (!isAuthenticated) {
    return (
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/splash">
              <Splash />
            </Route>
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/register">
              <Register />
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
        <IonTabs>
          <IonRouterOutlet>
            <ProtectedRoute exact path="/tasks/available">
              <AvailableTasks />
            </ProtectedRoute>
            <ProtectedRoute exact path="/tasks/my-tasks">
              <MyTasks />
            </ProtectedRoute>
            <ProtectedRoute exact path="/profile">
              <Profile />
            </ProtectedRoute>
            <ProtectedRoute exact path="/notifications">
              <NotificationCenter />
            </ProtectedRoute>
            <ProtectedRoute exact path="/notifications/settings">
              <NotificationSettings />
            </ProtectedRoute>
            <ProtectedRoute exact path="/">
              <Redirect to="/tasks/available" />
            </ProtectedRoute>
            <ProtectedRoute>
              <Redirect to="/tasks/available" />
            </ProtectedRoute>
          </IonRouterOutlet>

          <IonTabBar
            slot="bottom"
            className="bg-white border-t border-gray-200"
          >
            <IonTabButton tab="available-tasks" href="/tasks/available">
              <IonIcon
                aria-hidden="true"
                icon={listOutline}
                className="text-primary"
              />
              <IonLabel className="text-sm font-medium">Available</IonLabel>
            </IonTabButton>

            <IonTabButton tab="my-tasks" href="/tasks/my-tasks">
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
