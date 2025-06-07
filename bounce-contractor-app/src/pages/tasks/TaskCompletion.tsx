import React, { useState, useRef } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonTextarea,
  IonItem,
  IonLabel,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonActionSheet,
  IonAlert,
} from "@ionic/react";
import {
  cameraOutline,
  imagesOutline,
  closeOutline,
  checkmarkCircleOutline,
  trashOutline,
  addOutline,
} from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useCompleteTask } from "../../hooks/tasks/useTaskActions";
import { useTaskById } from "../../hooks/tasks/useTasks";
import { useI18n } from "../../hooks/common/useI18n";

interface TaskCompletionParams {
  id: string;
}

interface CompletionPhoto {
  id: string;
  dataUrl: string;
  file?: File;
  caption?: string;
}

const TaskCompletion: React.FC = () => {
  const { id } = useParams<TaskCompletionParams>();
  const history = useHistory();
  const { formatTaskTime } = useI18n();

  // State
  const [photos, setPhotos] = useState<CompletionPhoto[]>([]);
  const [notes, setNotes] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const completeTaskMutation = useCompleteTask();
  const { data: task, isLoading, isError } = useTaskById(id!);

  // File input ref for web fallback
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTakePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        const newPhoto: CompletionPhoto = {
          id: Date.now().toString(),
          dataUrl: image.dataUrl,
        };
        setPhotos((prev) => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setToastMessage("Failed to take photo. Please try again.");
      setShowToast(true);
    }
    setShowActionSheet(false);
  };

  const handleSelectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        const newPhoto: CompletionPhoto = {
          id: Date.now().toString(),
          dataUrl: image.dataUrl,
        };
        setPhotos((prev) => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      setToastMessage("Failed to select photo. Please try again.");
      setShowToast(true);
    }
    setShowActionSheet(false);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setToastMessage("Please select an image file.");
        setShowToast(true);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setToastMessage("Image must be smaller than 10MB.");
        setShowToast(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newPhoto: CompletionPhoto = {
            id: Date.now().toString(),
            dataUrl: e.target.result as string,
            file: file,
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    }
    setShowActionSheet(false);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotoToDelete(photoId);
    setShowDeleteAlert(true);
  };

  const confirmDeletePhoto = () => {
    if (photoToDelete) {
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoToDelete));
      setPhotoToDelete(null);
    }
    setShowDeleteAlert(false);
  };

  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmitCompletion = async () => {
    // Validation
    if (photos.length === 0) {
      setToastMessage("Please add at least one photo to complete the task.");
      setShowToast(true);
      return;
    }

    if (photos.length > 5) {
      setToastMessage("Maximum 5 photos allowed.");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert photos to files
      const photoFiles = photos.map((photo, index) => {
        if (photo.file) {
          return photo.file;
        }
        return dataUrlToFile(
          photo.dataUrl,
          `completion_photo_${index + 1}.jpg`,
        );
      });

      // Prepare completion data
      const completionData = {
        taskId: id!,
        completionPhotos: photoFiles,
        contractorNotes: notes.trim() || undefined,
        actualDuration: 120, // Default 2 hours - could be calculated from start time
        completedAt: new Date().toISOString(),
      };

      await completeTaskMutation.mutateAsync(completionData);

      setToastMessage("Task completed successfully!");
      setShowToast(true);

      // Navigate back to task details after a short delay
      setTimeout(() => {
        history.replace(`/task-details/${id}`);
      }, 1500);
    } catch (error) {
      console.error("Failed to complete task:", error);
      setToastMessage(
        error instanceof Error
          ? `Failed to complete task: ${error.message}`
          : "Failed to complete task. Please try again.",
      );
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={`/task-details/${id}`} />
            </IonButtons>
            <IonTitle>Complete Task</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex justify-center items-center h-full">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (isError || !task) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/my-tasks" />
            </IonButtons>
            <IonTitle>Complete Task</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <IonText className="text-lg font-medium text-gray-900">
              Task not found
            </IonText>
            <IonText className="text-sm text-gray-500 text-center mt-2">
              The task you're trying to complete doesn't exist or has been
              removed.
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/task-details/${id}`} />
          </IonButtons>
          <IonTitle>Complete Task</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4 space-y-4">
          {/* Task Summary */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="text-lg font-semibold">
                {task.title}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">
                    {task.customer.firstName} {task.customer.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-right">
                    {task.location.address.formattedAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="font-medium">
                    {formatTaskTime(new Date(task.scheduledDate))}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Photo Section */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center justify-between">
                <span>Completion Photos</span>
                <span className="text-sm text-gray-500">{photos.length}/5</span>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText className="text-sm text-gray-600 mb-4 block">
                Take photos of the completed setup, equipment condition, and any
                relevant details. At least 1 photo is required.
              </IonText>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <IonGrid className="mb-4">
                  <IonRow>
                    {photos.map((photo) => (
                      <IonCol size="6" key={photo.id}>
                        <div className="relative">
                          <img
                            src={photo.dataUrl}
                            alt="Completion photo"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <IonButton
                            fill="clear"
                            size="small"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-8 h-8 min-h-0"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <IonIcon icon={closeOutline} className="text-sm" />
                          </IonButton>
                        </div>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              )}

              {/* Add Photo Button */}
              {photos.length < 5 && (
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setShowActionSheet(true)}
                >
                  <IonIcon icon={addOutline} slot="start" />
                  Add Photo
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>

          {/* Notes Section */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Completion Notes</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonTextarea
                  placeholder="Add any notes about the task completion, customer feedback, or issues encountered..."
                  value={notes}
                  onIonInput={(e) => setNotes(e.detail.value!)}
                  rows={4}
                  maxlength={2000}
                  counter={true}
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Submit Button */}
          <div className="pb-8">
            <IonButton
              expand="block"
              color="success"
              onClick={handleSubmitCompletion}
              disabled={isSubmitting || photos.length === 0}
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" className="mr-2" />
                  Completing Task...
                </>
              ) : (
                <>
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Complete Task
                </>
              )}
            </IonButton>
          </div>
        </div>

        {/* Hidden file input for web fallback */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        {/* Action Sheet for Photo Options */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Take Photo",
              icon: cameraOutline,
              handler: handleTakePhoto,
            },
            {
              text: "Choose from Gallery",
              icon: imagesOutline,
              handler: handleSelectFromGallery,
            },
            {
              text: "Choose File (Web)",
              icon: imagesOutline,
              handler: () => {
                fileInputRef.current?.click();
                setShowActionSheet(false);
              },
            },
            {
              text: "Cancel",
              role: "cancel",
            },
          ]}
        />

        {/* Delete Photo Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Photo"
          message="Are you sure you want to delete this photo?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Delete",
              role: "destructive",
              handler: confirmDeletePhoto,
            },
          ]}
        />

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default TaskCompletion;
