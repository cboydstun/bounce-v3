import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  IonContent,
  IonPage,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonText,
  IonSpinner,
  IonToast,
  IonIcon,
  IonAlert,
} from "@ionic/react";
import { fingerPrint, eye, lockClosed, bug } from "ionicons/icons";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { LoginCredentials } from "../../types/auth.types";
import { APP_CONFIG } from "../../config/app.config";
import { useAuthTranslation } from "../../hooks/common/useI18n";
import { LanguageToggle } from "../../components/common/LanguageSwitcher";
import { useBiometric } from "../../hooks/auth/useBiometric";
import { BiometryType } from "../../types/biometric.types";
import BiometricPrompt from "../../components/auth/BiometricPrompt";
import { useLoginNotifications } from "../../hooks/auth/useLoginNotifications";
import BiometricDebugPanel from "../../components/debug/BiometricDebugPanel";
import { biometricService } from "../../services/auth/biometricService";

type AutoPromptState =
  | "checking"
  | "prompting"
  | "failed"
  | "completed"
  | "disabled";

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ from?: Location }>();
  const { t } = useAuthTranslation();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricPromptMode, setBiometricPromptMode] = useState<
    "setup" | "login"
  >("login");

  const [showLoginForm, setShowLoginForm] = useState(true);

  const login = useAuthStore((state) => state.login);
  const loginWithBiometric = useAuthStore((state) => state.loginWithBiometric);
  const isLoading = useAuthStore(authSelectors.isLoading);
  const error = useAuthStore(authSelectors.error);

  const {
    isAvailable,
    isEnabled,
    availability,
    shouldOfferSetup,
    setupBiometric,
    authenticateAndGetCredentials,
  } = useBiometric();

  const [shouldShowBiometricSetup, setShouldShowBiometricSetup] =
    useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Post-login biometric setup state
  const [pendingCredentials, setPendingCredentials] =
    useState<LoginCredentials | null>(null);

  // Notification permission hook
  const { requestNotificationPermission } = useLoginNotifications();

  // Check if biometric setup should be offered on component mount
  useEffect(() => {
    const checkBiometricSetup = async () => {
      if (APP_CONFIG.FEATURES.BIOMETRIC_AUTH && isAvailable && !isEnabled) {
        const shouldOffer = await shouldOfferSetup();
        setShouldShowBiometricSetup(shouldOffer);
      }
    };

    if (isAvailable !== undefined && isEnabled !== undefined) {
      checkBiometricSetup();
    }
  }, [isAvailable, isEnabled, shouldOfferSetup]);

  const getBiometricIcon = () => {
    if (!availability) return fingerPrint;

    switch (availability.biometryType) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        return eye;
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        return fingerPrint;
      default:
        return lockClosed;
    }
  };

  const getBiometricTypeText = () => {
    if (!availability) return t("biometric.touchId");

    switch (availability.biometryType) {
      case BiometryType.FACE_ID:
        return t("biometric.faceId");
      case BiometryType.FACE_AUTHENTICATION:
        return t("biometric.faceAuthentication");
      case BiometryType.TOUCH_ID:
        return t("biometric.touchId");
      case BiometryType.FINGERPRINT:
        return t("biometric.fingerprint");
      default:
        return t("biometric.biometric");
    }
  };

  const handleBiometricLogin = async () => {
    // Check if biometric is enabled first
    if (!isEnabled) {
      // Biometric is available but not set up - require credentials first
      if (!credentials.email || !credentials.password) {
        setToastMessage(
          "Please enter your email and password to set up biometric login.",
        );
        setShowToast(true);
        return;
      }

      // Store credentials and show setup prompt
      setPendingCredentials(credentials);
      setBiometricPromptMode("setup");
      setShowBiometricPrompt(true);
      return;
    }

    // Biometric is already enabled, show login prompt
    setBiometricPromptMode("login");
    setShowBiometricPrompt(true);
  };

  const handleBiometricPromptSuccess = async () => {
    setShowBiometricPrompt(false);

    if (biometricPromptMode === "login") {
      // For login mode, we need to actually perform the login with stored credentials
      try {
        await loginWithBiometric();

        // Request notification permission after successful biometric login (non-blocking)
        requestNotificationPermission()
          .then((result) => {
            if (result.success) {
              setToastMessage(result.message);
              setShowToast(true);
            }
          })
          .catch((error) => {
            console.log("Notification permission request failed:", error);
          });

        // Redirect to intended page or default
        const from = location.state?.from?.pathname || "/tasks/available";
        history.replace(from);
      } catch (error: any) {
        setToastMessage(error.message || "Biometric login failed");
        setShowToast(true);
      }
    }
    // For setup mode, handleBiometricSetup is called directly, so we don't need to do anything here
  };

  const handleBiometricPromptError = (error: string) => {
    setShowBiometricPrompt(false);
    setToastMessage(error);
    setShowToast(true);
  };

  const handleBiometricPromptFallback = () => {
    setShowBiometricPrompt(false);
    // User chose to use password instead
  };

  // Helper function for successful login redirect
  const handleSuccessfulLogin = () => {
    // Request notification permission (non-blocking)
    requestNotificationPermission()
      .then((result) => {
        if (result.success) {
          setToastMessage(result.message);
          setShowToast(true);
        }
      })
      .catch((error) => {
        console.log("Notification permission request failed:", error);
      });

    // Redirect to intended page
    const from = location.state?.from?.pathname || "/tasks/available";
    history.replace(from);
  };

  // Handle biometric setup with BiometricPrompt
  const handleBiometricSetup = async () => {
    if (!pendingCredentials) return;

    try {
      const setupResult = await setupBiometric({
        username: pendingCredentials.email,
        password: pendingCredentials.password,
      });

      if (setupResult.success) {
        setToastMessage(
          `${getBiometricTypeText()} login has been set up successfully!`,
        );
        setShowToast(true);
        setPendingCredentials(null);
        handleSuccessfulLogin();
      } else {
        throw new Error(setupResult.error || "Biometric setup failed");
      }
    } catch (error: any) {
      console.error("Biometric setup failed:", error);
      setToastMessage(
        error.message ||
          `${getBiometricTypeText()} setup failed, but you can try again later.`,
      );
      setShowToast(true);
      setPendingCredentials(null);
      handleSuccessfulLogin();
    }
  };

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      setToastMessage("Please enter both email and password");
      setShowToast(true);
      return;
    }

    try {
      // Step 1: Perform login
      await login(credentials);

      // Step 2: Check if we should offer biometric setup
      if (APP_CONFIG.FEATURES.BIOMETRIC_AUTH && isAvailable && !isEnabled) {
        // Store credentials for potential biometric setup
        setPendingCredentials(credentials);

        // Show BiometricPrompt for setup
        setBiometricPromptMode("setup");
        setShowBiometricPrompt(true);
        return; // Don't redirect yet
      }

      // Step 3: Normal redirect (if biometric not available or already set up)
      handleSuccessfulLogin();
    } catch (error) {
      setToastMessage("Login failed. Please check your credentials.");
      setShowToast(true);
    }
  };

  const handleRegister = () => {
    history.push("/register");
  };

  // Always show the login form (simplified approach)
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center min-h-full px-4 py-8">
          {/* Language Toggle */}
          <div className="absolute top-16 right-8 border-solid border-gray-200 rounded-lg p-2 bg-white shadow-sm">
            <LanguageToggle />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">BC</span>
            </div>
            <h1 className="text-heading mb-2">{t("login.title")}</h1>
            <p className="text-body">{t("login.subtitle")}</p>
          </div>

          {/* Login Form */}
          <div className="space-y-4 mb-6">
            <IonItem className="rounded-lg">
              <IonLabel position="stacked">{t("login.emailLabel")}</IonLabel>
              <IonInput
                type="email"
                value={credentials.email}
                onIonInput={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: e.detail.value!,
                  }))
                }
                placeholder={t("login.emailPlaceholder")}
                className="input-field"
              />
            </IonItem>

            <IonItem className="rounded-lg">
              <IonLabel position="stacked">{t("login.passwordLabel")}</IonLabel>
              <IonInput
                type="password"
                value={credentials.password}
                onIonInput={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.detail.value!,
                  }))
                }
                placeholder={t("login.passwordPlaceholder")}
                className="input-field"
              />
            </IonItem>

            <div className="flex items-center justify-between">
              <IonItem lines="none" className="pl-0">
                <IonCheckbox
                  checked={credentials.rememberMe}
                  onIonChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      rememberMe: e.detail.checked,
                    }))
                  }
                />
                <IonLabel className="ml-2 text-sm">
                  {t("login.rememberMe")}
                </IonLabel>
              </IonItem>

              <IonButton fill="clear" size="small" className="text-primary">
                {t("login.forgotPassword")}
              </IonButton>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <IonText color="danger" className="text-sm">
                {error}
              </IonText>
            </div>
          )}

          {/* Login Button */}
          <IonButton
            expand="block"
            onClick={handleLogin}
            disabled={isLoading}
            className="btn-primary mb-4"
          >
            {isLoading ? <IonSpinner name="crescent" className="mr-2" /> : null}
            {isLoading ? t("login.loggingIn") : t("login.loginButton")}
          </IonButton>

          {/* Register Link */}
          <div className="text-center">
            <IonText className="text-body">
              {t("login.noAccount")}{" "}
              <IonButton
                fill="clear"
                size="small"
                onClick={handleRegister}
                className="text-primary font-medium"
              >
                {t("login.signUpLink")}
              </IonButton>
            </IonText>
          </div>

          {/* Biometric Login Section */}
          {APP_CONFIG.FEATURES.BIOMETRIC_AUTH && isAvailable && (
            <div className="mt-8">
              <div className="flex items-center mb-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">
                  {t("common.or")}
                </span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <IonButton
                expand="block"
                fill="outline"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || isLoading}
                className="border-primary text-primary"
              >
                <IonIcon icon={getBiometricIcon()} className="mr-2" />
                {biometricLoading ? (
                  <IonSpinner name="crescent" className="mr-2" />
                ) : null}
                {biometricLoading
                  ? t("biometric.authenticating")
                  : isEnabled
                    ? t("biometric.useYourBiometric", {
                        type: getBiometricTypeText(),
                      })
                    : `Set up ${getBiometricTypeText()} Login`}
              </IonButton>
            </div>
          )}

          {/* Biometric Setup Offer */}
          {APP_CONFIG.FEATURES.BIOMETRIC_AUTH && shouldShowBiometricSetup && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <IonIcon
                  icon={getBiometricIcon()}
                  className="w-6 h-6 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    {t("biometric.setup.title")}
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    {t("biometric.setup.subtitle", {
                      type: getBiometricTypeText(),
                    })}
                  </p>
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => history.push("/biometric-setup")}
                    className="text-blue-600 p-0 h-auto"
                  >
                    {t("biometric.setup.enable_button", {
                      type: getBiometricTypeText(),
                    })}
                  </IonButton>
                </div>
              </div>
            </div>
          )}

          {/* Debug Panel Button (Development Only) */}
          {APP_CONFIG.IS_DEVELOPMENT && APP_CONFIG.FEATURES.BIOMETRIC_AUTH && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <IonButton
                expand="block"
                fill="clear"
                size="small"
                onClick={() => setShowDebugPanel(true)}
                className="text-gray-500"
              >
                <IonIcon icon={bug} className="mr-2" />
                Biometric Debug Panel
              </IonButton>
            </div>
          )}
        </div>

        {/* Debug Panel */}
        <BiometricDebugPanel
          isOpen={showDebugPanel}
          onDidDismiss={() => setShowDebugPanel(false)}
        />

        {/* Biometric Prompt */}
        <BiometricPrompt
          isOpen={showBiometricPrompt}
          onDidDismiss={() => setShowBiometricPrompt(false)}
          onSuccess={
            biometricPromptMode === "setup"
              ? handleBiometricSetup
              : handleBiometricPromptSuccess
          }
          onError={handleBiometricPromptError}
          onFallback={handleBiometricPromptFallback}
          options={{
            reason:
              biometricPromptMode === "setup"
                ? `Set up ${getBiometricTypeText()} login for faster access`
                : "Authenticate to access your account",
            title:
              biometricPromptMode === "setup"
                ? "Set up Quick Login"
                : "Welcome Back",
            subtitle: `Use your ${getBiometricTypeText()} to ${biometricPromptMode === "setup" ? "enable quick login" : "sign in"}`,
            fallbackTitle: "Use Password Instead",
            negativeButtonText: "Cancel",
            maxAttempts: 3,
          }}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
