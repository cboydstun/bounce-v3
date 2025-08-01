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
import { closeOutline, sendOutline, bugOutline } from "ionicons/icons";
import { supportService } from "../../services/api/supportService";

interface BugReportFormProps {
  onBack: () => void;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const BugReportForm: React.FC<BugReportFormProps> = ({
  onBack,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = supportService.getBugCategories();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Bug title is required";
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
      const response = await supportService.submitBugReport(formData);
      onSuccess(
        `Bug report submitted successfully! Reference ID: ${response.referenceId}`,
      );
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      onSuccess("Failed to submit bug report. Please try again.");
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
          <IonTitle>Report Bug</IonTitle>
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
          <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400 mb-6">
            <div className="flex items-center">
              <IonIcon icon={bugOutline} className="text-red-600 mr-2" />
              <div>
                <IonText className="text-sm text-red-800">
                  <strong>Help us fix bugs faster!</strong> Please provide as
                  much detail as possible.
                </IonText>
              </div>
            </div>
          </div>

          <IonItem>
            <IonLabel position="stacked">Bug Title *</IonLabel>
            <IonInput
              value={formData.title}
              placeholder="Brief summary of the bug"
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
                🟢 Low - Minor issue
              </IonSelectOption>
              <IonSelectOption value="medium">
                🟡 Medium - Affects functionality
              </IonSelectOption>
              <IonSelectOption value="high">
                🟠 High - Major problem
              </IonSelectOption>
              <IonSelectOption value="critical">
                🔴 Critical - App unusable
              </IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Category *</IonLabel>
            <IonSelect
              value={formData.category}
              placeholder="Select bug category"
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
              placeholder="Describe what happened and what went wrong..."
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
            <IonLabel position="stacked">Steps to Reproduce</IonLabel>
            <IonTextarea
              value={formData.stepsToReproduce}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              rows={4}
              onIonInput={(e) =>
                setFormData({ ...formData, stepsToReproduce: e.detail.value! })
              }
            />
            <IonText className="text-xs text-gray-600 mt-1">
              Help us reproduce the bug by listing the exact steps
            </IonText>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Expected Behavior</IonLabel>
            <IonTextarea
              value={formData.expectedBehavior}
              placeholder="What should have happened?"
              rows={3}
              onIonInput={(e) =>
                setFormData({ ...formData, expectedBehavior: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Actual Behavior</IonLabel>
            <IonTextarea
              value={formData.actualBehavior}
              placeholder="What actually happened instead?"
              rows={3}
              onIonInput={(e) =>
                setFormData({ ...formData, actualBehavior: e.detail.value! })
              }
            />
          </IonItem>

          <div className="mt-6">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={isSubmitting}
              color="danger"
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" className="mr-2" />
                  Submitting Bug Report...
                </>
              ) : (
                <>
                  <IonIcon icon={sendOutline} slot="start" />
                  Submit Bug Report
                </>
              )}
            </IonButton>
          </div>

          {/* Response Time Info */}
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <IonText className="text-sm text-orange-800">
              <strong>Response Time:</strong> Based on your priority level, our
              development team will respond within{" "}
              {formData.priority === "critical"
                ? "2 hours"
                : formData.priority === "high"
                  ? "4 hours"
                  : formData.priority === "medium"
                    ? "24 hours"
                    : "48 hours"}
              .
            </IonText>
          </div>

          {/* System Info Notice */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <IonText className="text-sm text-blue-800">
              <strong>📱 System Information:</strong> Your device info, app
              version, and platform details will be automatically included to
              help our developers diagnose the issue.
            </IonText>
          </div>
        </div>
      </IonContent>
    </>
  );
};

export default BugReportForm;
