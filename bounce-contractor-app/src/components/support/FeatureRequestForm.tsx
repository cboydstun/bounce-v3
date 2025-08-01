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
import { closeOutline, sendOutline, bulbOutline } from "ionicons/icons";
import { supportService } from "../../services/api/supportService";

interface FeatureRequestFormProps {
  onBack: () => void;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const FeatureRequestForm: React.FC<FeatureRequestFormProps> = ({
  onBack,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    useCase: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = supportService.getFeatureCategories();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Feature title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
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
      const response = await supportService.submitFeatureRequest(formData);
      onSuccess(
        `Feature request submitted successfully! Reference ID: ${response.referenceId}`,
      );
    } catch (error) {
      console.error("Failed to submit feature request:", error);
      onSuccess("Failed to submit feature request. Please try again.");
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
          <IonTitle>Request Feature</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400 mb-6">
            <div className="flex items-center">
              <IonIcon icon={bulbOutline} className="text-purple-600 mr-2" />
              <div>
                <IonText className="text-sm text-purple-800">
                  <strong>Share your ideas!</strong> Help us improve the app
                  with your suggestions.
                </IonText>
              </div>
            </div>
          </div>

          <IonItem>
            <IonLabel position="stacked">Feature Title *</IonLabel>
            <IonInput
              value={formData.title}
              placeholder="Brief summary of the feature"
              onIonInput={(e) =>
                setFormData({ ...formData, title: e.detail.value! })
              }
            />
            {errors.title && (
              <IonText color="danger" className="text-sm">
                {errors.title}
              </IonText>
            )}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Priority</IonLabel>
            <IonSelect
              value={formData.priority}
              onIonChange={(e) =>
                setFormData({ ...formData, priority: e.detail.value })
              }
            >
              <IonSelectOption value="low">
                🟢 Low - Nice to have
              </IonSelectOption>
              <IonSelectOption value="medium">
                🟡 Medium - Would be helpful
              </IonSelectOption>
              <IonSelectOption value="high">
                🟠 High - Really needed
              </IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Category *</IonLabel>
            <IonSelect
              value={formData.category}
              placeholder="Select feature category"
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
            <IonLabel position="stacked">Description *</IonLabel>
            <IonTextarea
              value={formData.description}
              placeholder="Describe the feature you'd like to see..."
              rows={4}
              onIonInput={(e) =>
                setFormData({ ...formData, description: e.detail.value! })
              }
            />
            {errors.description && (
              <IonText color="danger" className="text-sm">
                {errors.description}
              </IonText>
            )}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Use Case</IonLabel>
            <IonTextarea
              value={formData.useCase}
              placeholder="How would this feature help you? What problem would it solve?&#10;&#10;Example: 'As a contractor, I would like to...' or 'This would help me because...'"
              rows={4}
              onIonInput={(e) =>
                setFormData({ ...formData, useCase: e.detail.value! })
              }
            />
            <IonText className="text-xs text-gray-600 mt-1">
              Help us understand how this feature would benefit contractors
            </IonText>
          </IonItem>

          <div className="mt-6">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={isSubmitting}
              color="secondary"
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" className="mr-2" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <IonIcon icon={sendOutline} slot="start" />
                  Submit Feature Request
                </>
              )}
            </IonButton>
          </div>

          {/* Response Time Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <IonText className="text-sm text-blue-800">
              <strong>Review Process:</strong> Our product team reviews feature
              requests based on priority and user demand. We'll consider your
              suggestion for future updates!
            </IonText>
          </div>

          {/* Examples */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <IonText className="text-sm text-green-800">
              <strong>💡 Example Ideas:</strong>
              <ul className="mt-2 ml-4 list-disc">
                <li>Dark mode for the app</li>
                <li>Push notifications for new tasks</li>
                <li>Offline mode for viewing tasks</li>
                <li>Calendar integration</li>
                <li>Photo upload improvements</li>
              </ul>
            </IonText>
          </div>
        </div>
      </IonContent>
    </>
  );
};

export default FeatureRequestForm;
