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
} from "@ionic/react";
import { fingerPrint, eye, lockClosed } from "ionicons/icons";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { LoginCredentials } from "../../types/auth.types";
import { APP_CONFIG } from "../../config/app.config";
import { useAuthTranslation } from "../../hooks/common/useI18n";
import { LanguageToggle } from "../../components/common/LanguageSwitcher";
import { useBiometric } from "../../hooks/auth/useBiometric";
import { BiometryType } from "../../types/biometric.types";
import BiometricPrompt from "../../components/auth/BiometricPrompt";
import { useLoginNotifications } from "../../hooks/auth/useLoginNotifications";

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

  // Auto-biometric prompt state
  const [autoPromptState, setAutoPromptState] =
    useState<AutoPromptState>("checking");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [autoPromptAttempted, setAutoPromptAttempted] = useState(false);

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

  // Notification permission hook
  const { requestNotificationPermission } = useLoginNotifications();

  // Auto-biometric prompt logic
  useEffect(() => {
    const handleAutoPrompt = async () => {
      // Skip if already attempted in this session
      if (autoPromptAttempted) {
        setAutoPromptState("disabled");
        setShowLoginForm(true);
        return;
      }

      // Skip if biometric feature is disabled
      if (!APP_CONFIG.FEATURES.BIOMETRIC_AUTH) {
        setAutoPromptState("disabled");
        setShowLoginForm(true);
        return;
      }

      try {
        setAutoPromptState("checking");

        // Check if biometric is available AND enabled
        if (isAvailable && isEnabled) {
          setAutoPromptState("prompting");

          // Automatically trigger biometric authentication
          const result = await authenticateAndGetCredentials({
            reason: "Authenticate to access your account",
            title: "Welcome Back",
            subtitle: `Use your ${getBiometricTypeText()} to sign in`,
            fallbackTitle: "Use Password Instead",
            negativeButtonText: "Cancel",
          });

          if (result.success && result.credentials) {
            setAutoPromptState("completed");

            // Use the retrieved credentials to log in
            await login({
              email: result.credentials.username,
              password: result.credentials.password,
              rememberMe: false,
            });

            // Request notification permission after successful login (non-blocking)
            requestNotificationPermission()
              .then((permissionResult) => {
                if (permissionResult.success) {
                  console.log("Notification permission granted");
                }
              })
              .catch((error) => {
                console.log("Notification permission request failed:", error);
              });

            // Redirect to intended page or default
            const from = location.state?.from?.pathname || "/tasks/available";
            history.replace(from);
            return;
          } else {
            // Biometric failed or was cancelled - show login form
            setAutoPromptState("failed");
            setAutoPromptAttempted(true);
            setShowLoginForm(true);

            if (result.error) {
              setToastMessage(result.error);
              setShowToast(true);
            }
          }
        } else {
          // Biometric not available or not enabled - show login form
          setAutoPromptState("disabled");
          setShowLoginForm(true);

          // Check if biometric setup should be offered
          if (isAvailable && !isEnabled) {
            const shouldOffer = await shouldOfferSetup();
            setShouldShowBiometricSetup(shouldOffer);
          }
        }
      } catch (error: any) {
        console.error("Auto-biometric prompt error:", error);
        setAutoPromptState("failed");
        setAutoPromptAttempted(true);
        setShowLoginForm(true);
        setToastMessage(error.message || "Biometric authentication failed");
        setShowToast(true);
      }
    };

    // Only run auto-prompt if biometric hook has loaded
    if (isAvailable !== undefined && isEnabled !== undefined) {
      handleAutoPrompt();
    }
  }, [
    isAvailable,
    isEnabled,
    autoPromptAttempted,
    authenticateAndGetCredentials,
    login,
    requestNotificationPermission,
    history,
    location.state,
    shouldOfferSetup,
  ]);

  // Handle fallback to password login
  const handleUsePasswordInstead = () => {
    setAutoPromptAttempted(true);
    setAutoPromptState("failed");
    setShowLoginForm(true);
  };

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
    setBiometricLoading(true);

    try {
      // Check if biometric is enabled first
      if (!isEnabled) {
        // Biometric is available but not set up - set it up now
        if (!credentials.email || !credentials.password) {
          setToastMessage(
            "Please enter your email and password to set up biometric login.",
          );
          setShowToast(true);
          setBiometricLoading(false);
          return;
        }

        // First, authenticate with password to verify identity
        await login(credentials);

        // Now set up biometric authentication with the verified credentials
        try {
          const setupResult = await setupBiometric({
            username: credentials.email,
            password: credentials.password,
          });

          if (setupResult.success) {
            setToastMessage(
              "Login successful! Biometric authentication has been set up.",
            );
          } else {
            setToastMessage(
              "Login successful! Biometric setup failed, but you can try again later.",
            );
          }
        } catch (setupError) {
          console.error("Biometric setup failed:", setupError);
          setToastMessage(
            "Login successful! Biometric setup failed, but you can try again later.",
          );
        }
        setShowToast(true);

        // Request notification permission after successful login (non-blocking)
        requestNotificationPermission()
          .then((result) => {
            if (result.success) {
              console.log("Notification permission granted");
            }
          })
          .catch((error) => {
            console.log("Notification permission request failed:", error);
          });

        // Redirect to intended page or default
        const from = location.state?.from?.pathname || "/tasks/available";
        history.replace(from);
        return;
      }

      // Biometric is already enabled, use it for login
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
      setToastMessage(error.message || t("biometric.failed"));
      setShowToast(true);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleBiometricPromptSuccess = () => {
    setShowBiometricPrompt(false);
    // Redirect after successful biometric authentication
    const from = location.state?.from?.pathname || "/tasks/available";
    history.replace(from);
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

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      setToastMessage("Please enter both email and password");
      setShowToast(true);
      return;
    }

    try {
      await login(credentials);

      // Request notification permission after successful login (non-blocking)
      requestNotificationPermission()
        .then((result) => {
          if (result.success) {
            setToastMessage(result.message);
            setShowToast(true);
          }
          // Don't show error messages for notification failures - just log them
        })
        .catch((error) => {
          console.log("Notification permission request failed:", error);
          // Silently fail - don't interrupt the login flow
        });

      // Redirect to intended page or default
      const from = location.state?.from?.pathname || "/tasks/available";
      history.replace(from);
    } catch (error) {
      setToastMessage("Login failed. Please check your credentials.");
      setShowToast(true);
    }
  };

  const handleRegister = () => {
    history.push("/register");
  };

  // Render loading state during auto-prompt checking
  if (autoPromptState === "checking") {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex flex-col justify-center items-center min-h-full px-4 py-8">
            {/* Language Toggle */}
            <div className="absolute top-4 right-4">
              <LanguageToggle />
            </div>

            {/* Loading State */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-white">BC</span>
              </div>
              <IonSpinner name="crescent" className="mb-4" />
              <h2 className="text-lg font-medium mb-2">
                Checking biometric...
              </h2>
              <p className="text-gray-600">Please wait</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Render biometric prompt state
  if (autoPromptState === "prompting") {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex flex-col justify-center items-center min-h-full px-4 py-8">
            {/* Language Toggle */}
            <div className="absolute top-4 right-4">
              <LanguageToggle />
            </div>

            {/* Biometric Prompt State */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-white">BC</span>
              </div>
              <IonIcon
                icon={getBiometricIcon()}
                className="w-16 h-16 text-primary mb-4"
              />
              <h2 className="text-lg font-medium mb-2">Welcome Back!</h2>
              <p className="text-gray-600 mb-6">
                Use your {getBiometricTypeText()} to sign in
              </p>
              <IonSpinner name="crescent" className="mb-4" />
              <p className="text-sm text-gray-500 mb-6">Authenticating...</p>

              {/* Fallback Button */}
              <IonButton
                fill="clear"
                onClick={handleUsePasswordInstead}
                className="text-primary"
              >
                Use Password Instead
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Show login form for failed, disabled, or when showLoginForm is true
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
        </div>

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
