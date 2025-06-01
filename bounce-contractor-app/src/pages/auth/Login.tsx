import React, { useState } from "react";
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
} from "@ionic/react";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { LoginCredentials } from "../../types/auth.types";
import { APP_CONFIG } from "../../config/app.config";
import { useAuthTranslation } from "../../hooks/common/useI18n";
import { LanguageToggle } from "../../components/common/LanguageSwitcher";

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

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore(authSelectors.isLoading);
  const error = useAuthStore(authSelectors.error);

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      setToastMessage("Please enter both email and password");
      setShowToast(true);
      return;
    }

    try {
      await login(credentials);

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

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col justify-center min-h-full px-4 py-8">
          {/* Language Toggle */}
          <div className="absolute top-4 right-4">
            <LanguageToggle />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">BC</span>
            </div>
            <h1 className="text-heading mb-2">{t('login.title')}</h1>
            <p className="text-body">{t('login.subtitle')}</p>
          </div>

          {/* Login Form */}
          <div className="space-y-4 mb-6">
            <IonItem className="rounded-lg">
              <IonLabel position="stacked">{t('login.emailLabel')}</IonLabel>
              <IonInput
                type="email"
                value={credentials.email}
                onIonInput={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: e.detail.value!,
                  }))
                }
                placeholder={t('login.emailPlaceholder')}
                className="input-field"
              />
            </IonItem>

            <IonItem className="rounded-lg">
              <IonLabel position="stacked">{t('login.passwordLabel')}</IonLabel>
              <IonInput
                type="password"
                value={credentials.password}
                onIonInput={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.detail.value!,
                  }))
                }
                placeholder={t('login.passwordPlaceholder')}
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
                <IonLabel className="ml-2 text-sm">{t('login.rememberMe')}</IonLabel>
              </IonItem>

              <IonButton fill="clear" size="small" className="text-primary">
                {t('login.forgotPassword')}
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
            {isLoading ? t('login.loggingIn') : t('login.loginButton')}
          </IonButton>

          {/* Register Link */}
          <div className="text-center">
            <IonText className="text-body">
              {t('login.noAccount')}{" "}
              <IonButton
                fill="clear"
                size="small"
                onClick={handleRegister}
                className="text-primary font-medium"
              >
                {t('login.signUpLink')}
              </IonButton>
            </IonText>
          </div>

          {/* Biometric Login (if enabled) */}
          {APP_CONFIG.FEATURES.BIOMETRIC_AUTH && (
            <div className="mt-8 text-center">
              <IonButton
                fill="outline"
                size="small"
                className="border-primary text-primary"
              >
                Use Biometric Login
              </IonButton>
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
