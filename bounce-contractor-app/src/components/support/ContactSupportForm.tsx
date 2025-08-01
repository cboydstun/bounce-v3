import React, { useState } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { closeOutline, sendOutline } from "ionicons/icons";
import { supportService } from "../../services/api/supportService";

interface ContactSupportFormProps {
  onBack: () => void;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ContactSupportForm: React.FC<ContactSupportFormProps> = ({
  onBack,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    type: "general" as const,
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = supportService.getSupportCategories();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supportService.submitSupportRequest(formData);
      onSuccess(
        `Support request submitted successfully! Reference ID: ${response.referenceId}`,
      );
    } catch (error) {
      console.error("Failed to submit support request:", error);
      onSuccess("Failed to submit support request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={onBack}>
              ← Back
            </IonButton>
          </IonButtons>
          <IonTitle>Contact Support</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-4">
          <IonItem>
            <IonLabel position="stacked">Priority</IonLabel>
            <IonSelect
              value={formData.priority}
              onIonChange={(e) =>
                setFormData({ ...formData, priority: e.detail.value })
              }
            >
              <IonSelectOption value="low">Low</IonSelectOption>
              <IonSelectOption value="medium">Medium</IonSelectOption>
              <IonSelectOption value="high">High</IonSelectOption>
              <IonSelectOption value="urgent">Urgent</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Category *</IonLabel>
            <IonSelect
              value={formData.category}
              placeholder="Select a category"
              onIonChange={(e) =>
                setFormData({ ...formData, category: e.detail.value })
              }
            >
              {categories.map((category) => (
                <IonSelectOption key={category} value={category}>
                  {category}
                </IonSelectOption>
              ))}
            </IonSelect>
            {errors.category && (
              <IonText color="danger" className="text-sm">
                {errors.category}
              </IonText>
            )}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Subject *</IonLabel>
            <IonInput
              value={formData.subject}
              placeholder="Brief description of your issue"
              onIonInput={(e) =>
                setFormData({ ...formData, subject: e.detail.value! })
              }
            />
            {errors.subject && (
              <IonText color="danger" className="text-sm">
                {errors.subject}
              </IonText>
            )}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Message *</IonLabel>
            <IonTextarea
              value={formData.message}
              placeholder="Please provide detailed information about your issue..."
              rows={6}
              onIonInput={(e) =>
                setFormData({ ...formData, message: e.detail.value! })
              }
            />
            {errors.message && (
              <IonText color="danger" className="text-sm">
                {errors.message}
              </IonText>
            )}
          </IonItem>

          <div className="mt-6">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <IonIcon icon={sendOutline} slot="start" />
                  Submit Request
                </>
              )}
            </IonButton>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <IonText className="text-sm text-blue-800">
              <strong>Response Time:</strong> Based on your priority level, you
              can expect a response within{" "}
              {formData.priority === "urgent"
                ? "2 hours"
                : formData.priority === "high"
                  ? "4 hours"
                  : formData.priority === "medium"
                    ? "24 hours"
                    : "48 hours"}
              .
            </IonText>
          </div>
        </div>
      </IonContent>
    </>
  );
};

export default ContactSupportForm;
