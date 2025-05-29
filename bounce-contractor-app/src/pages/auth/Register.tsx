import React, { useState } from "react";
import { useHistory } from "react-router-dom";
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
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { RegisterData, RegisterFormData } from "../../types/auth.types";

const Register: React.FC = () => {
  const history = useHistory();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    skills: ["delivery", "setup"], // Default skills
    agreeToTerms: false,
    agreeToPrivacy: false,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore(authSelectors.isLoading);
  const error = useAuthStore(authSelectors.error);

  const validateForm = (): boolean => {
    if (!formData.name) {
      setToastMessage("Please enter your full name");
      setShowToast(true);
      return false;
    }

    if (!formData.email) {
      setToastMessage("Please enter your email address");
      setShowToast(true);
      return false;
    }

    if (!formData.phone) {
      setToastMessage("Please enter your phone number");
      setShowToast(true);
      return false;
    }

    if (!formData.password || formData.password.length < 8) {
      setToastMessage("Password must be at least 8 characters long");
      setShowToast(true);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setToastMessage("Passwords do not match");
      setShowToast(true);
      return false;
    }

    if (!formData.agreeToTerms) {
      setToastMessage("Please agree to the Terms of Service");
      setShowToast(true);
      return false;
    }

    if (!formData.agreeToPrivacy) {
      setToastMessage("Please agree to the Privacy Policy");
      setShowToast(true);
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Transform data to match API format
      const apiData: RegisterData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        skills: formData.skills,
      };

      await register(apiData);
      setToastMessage(
        "Registration successful! Please check your email to verify your account.",
      );
      setShowToast(true);

      // Redirect to login after successful registration
      setTimeout(() => {
        history.replace("/login");
      }, 2000);
    } catch (error) {
      setToastMessage("Registration failed. Please try again.");
      setShowToast(true);
    }
  };

  const updateFormData = (
    field: string,
    value: string | boolean | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-heading mb-2">Join Our Team</h1>
            <p className="text-body">
              Create your contractor account to get started
            </p>
          </div>

          {/* Registration Form */}
          <div className="space-y-4 mb-6">
            <IonItem className="rounded-lg">
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                value={formData.name}
                onIonInput={(e) => updateFormData("name", e.detail.value!)}
                placeholder="Enter your full name"
                className="input-field"
              />
            </IonItem>

            <IonItem className="rounded-lg">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={formData.email}
                onIonInput={(e) => updateFormData("email", e.detail.value!)}
                placeholder="Enter your email"
                className="input-field"
              />
            </IonItem>

            <IonItem className="rounded-lg">
              <IonLabel position="stacked">Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={formData.phone}
                onIonInput={(e) => updateFormData("phone", e.detail.value!)}
                placeholder="Enter your phone number"
                className="input-field"
              />
            </IonItem>

            <IonItem className="rounded-lg">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={formData.password}
                onIonInput={(e) => updateFormData("password", e.detail.value!)}
                placeholder="Create a password"
                className="input-field"
              />
            </IonItem>

            <IonItem className="rounded-lg">
              <IonLabel position="stacked">Confirm Password</IonLabel>
              <IonInput
                type="password"
                value={formData.confirmPassword}
                onIonInput={(e) =>
                  updateFormData("confirmPassword", e.detail.value!)
                }
                placeholder="Confirm your password"
                className="input-field"
              />
            </IonItem>
          </div>

          {/* Terms and Privacy */}
          <div className="space-y-3 mb-6">
            <IonItem lines="none" className="pl-0">
              <IonCheckbox
                checked={formData.agreeToTerms}
                onIonChange={(e) =>
                  updateFormData("agreeToTerms", e.detail.checked)
                }
              />
              <IonLabel className="ml-2 text-sm">
                I agree to the{" "}
                <IonButton
                  fill="clear"
                  size="small"
                  className="text-primary p-0 h-auto"
                >
                  Terms of Service
                </IonButton>
              </IonLabel>
            </IonItem>

            <IonItem lines="none" className="pl-0">
              <IonCheckbox
                checked={formData.agreeToPrivacy}
                onIonChange={(e) =>
                  updateFormData("agreeToPrivacy", e.detail.checked)
                }
              />
              <IonLabel className="ml-2 text-sm">
                I agree to the{" "}
                <IonButton
                  fill="clear"
                  size="small"
                  className="text-primary p-0 h-auto"
                >
                  Privacy Policy
                </IonButton>
              </IonLabel>
            </IonItem>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <IonText color="danger" className="text-sm">
                {error}
              </IonText>
            </div>
          )}

          {/* Register Button */}
          <IonButton
            expand="block"
            onClick={handleRegister}
            disabled={isLoading}
            className="btn-primary mb-4"
          >
            {isLoading ? <IonSpinner name="crescent" className="mr-2" /> : null}
            {isLoading ? "Creating Account..." : "Create Account"}
          </IonButton>

          {/* Login Link */}
          <div className="text-center">
            <IonText className="text-body">
              Already have an account?{" "}
              <IonButton
                fill="clear"
                size="small"
                onClick={() => history.push("/login")}
                className="text-primary font-medium"
              >
                Sign In
              </IonButton>
            </IonText>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastMessage.includes("successful") ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
