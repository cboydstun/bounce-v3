import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonCheckbox,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonLoading,
  IonToast,
  IonAvatar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  saveOutline,
  cameraOutline,
  personOutline,
  mailOutline,
  callOutline,
  businessOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuthStore, authSelectors } from "../../store/authStore";
import { ContractorProfile, User, ContractorSkill, SkillCategory } from "../../types/auth.types";
import { photoService, PhotoUploadProgress } from "../../services/api/photoService";

interface EditProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  skills: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const AVAILABLE_SKILLS: { id: string; name: string; category: SkillCategory }[] = [
  { id: "delivery", name: "Delivery", category: "delivery" },
  { id: "setup", name: "Setup & Installation", category: "setup" },
  { id: "breakdown", name: "Breakdown & Pickup", category: "setup" },
  { id: "electrical", name: "Electrical Work", category: "electrical" },
  { id: "safety_inspection", name: "Safety Inspection", category: "safety" },
  { id: "customer_service", name: "Customer Service", category: "customer_service" },
  { id: "equipment_maintenance", name: "Equipment Maintenance", category: "equipment_maintenance" },
  { id: "heavy_lifting", name: "Heavy Lifting", category: "delivery" },
  { id: "event_coordination", name: "Event Coordination", category: "customer_service" },
];

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Colleague",
  "Other",
];

const EditProfile: React.FC = () => {
  const history = useHistory();
  const user = useAuthStore(authSelectors.user);
  const profile = useAuthStore(authSelectors.profile);
  const isLoading = useAuthStore(authSelectors.isLoading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updateProfilePhoto = useAuthStore((state) => state.updateProfilePhoto);

  const [formData, setFormData] = useState<EditProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    skills: [],
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  type EditProfileFormErrors = {
    [K in keyof EditProfileForm]?: string;
  };
  const [formErrors, setFormErrors] = useState<EditProfileFormErrors>({});
  
  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Initialize form with current user/profile data
  useEffect(() => {
    if (user && profile) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        businessName: profile.businessName || "",
        skills: profile.skills?.map(skill => skill.name).filter(Boolean) || [],
        emergencyContactName: profile.emergencyContact?.name || "",
        emergencyContactPhone: profile.emergencyContact?.phone || "",
        emergencyContactRelationship: profile.emergencyContact?.relationship || "",
      });
    }
  }, [user, profile]);

  const validateForm = (): boolean => {
    const errors: EditProfileFormErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = "Invalid phone number format";
    }

    if (formData.skills.length === 0) {
      errors.skills = "At least one skill is required";
    }

    if (formData.emergencyContactName && !formData.emergencyContactPhone) {
      errors.emergencyContactPhone = "Emergency contact phone is required when name is provided";
    }

    if (formData.emergencyContactPhone && !formData.emergencyContactName) {
      errors.emergencyContactName = "Emergency contact name is required when phone is provided";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStringInputChange = (field: Exclude<keyof EditProfileForm, 'skills'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    } as EditProfileForm));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleArrayInputChange = (field: 'skills', value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSkillToggle = (skillName: string) => {
    if (!skillName || typeof skillName !== 'string') {
      console.warn('Invalid skill name:', skillName);
      return;
    }

    const currentSkills = formData.skills.filter(Boolean); // Remove any undefined/null values
    const updatedSkills = currentSkills.includes(skillName)
      ? currentSkills.filter(skill => skill !== skillName)
      : [...currentSkills, skillName];

    handleArrayInputChange("skills", updatedSkills);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setToastMessage("Please fix the errors before saving");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      // Combine firstName and lastName into a single name field for the API
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      // Prepare profile update data - using any type to match API expectations
      const profileUpdateData: any = {
        name: fullName,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        businessName: formData.businessName || undefined,
        skills: formData.skills
          .filter(skillName => skillName && typeof skillName === 'string')
          .map(skillName => {
            const skillInfo = AVAILABLE_SKILLS.find(s => s.name === skillName);
            return {
              id: skillInfo?.id || skillName.toLowerCase().replace(/\s+/g, '_'),
              name: skillName,
              category: skillInfo?.category || "customer_service",
              level: "intermediate" as const,
              certified: false,
            };
          }),
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
          email: undefined,
        },
      };

      await updateProfile(profileUpdateData);

      setToastMessage("Profile updated successfully!");
      setToastColor("success");
      setShowToast(true);

      // Navigate back to profile after a short delay
      setTimeout(() => {
        history.goBack();
      }, 1500);

    } catch (error) {
      console.error("Failed to update profile:", error);
      setToastMessage("Failed to update profile. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const getInitials = () => {
    return `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase();
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const previewUrl = photoService.createPreviewUrl(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    setIsUploadingPhoto(true);
    setUploadProgress(0);

    try {
      const uploadResult = await photoService.uploadProfilePhoto(
        selectedPhoto,
        (progress: PhotoUploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      // Update the profile photo in the store
      await updateProfilePhoto(uploadResult.url);

      setToastMessage("Profile photo updated successfully!");
      setToastColor("success");
      setShowToast(true);

      // Clean up
      setSelectedPhoto(null);
      if (photoPreview) {
        photoService.revokePreviewUrl(photoPreview);
        setPhotoPreview(null);
      }
    } catch (error) {
      console.error("Photo upload failed:", error);
      setToastMessage("Failed to upload photo. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  const handleChangePhotoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        setSelectedPhoto(file);
        const previewUrl = photoService.createPreviewUrl(file);
        setPhotoPreview(previewUrl);
      }
    };
    input.click();
  };

  const cancelPhotoSelection = () => {
    setSelectedPhoto(null);
    if (photoPreview) {
      photoService.revokePreviewUrl(photoPreview);
      setPhotoPreview(null);
    }
  };

  // Clean up photo preview URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) {
        photoService.revokePreviewUrl(photoPreview);
      }
    };
  }, [photoPreview]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Edit Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={isLoading}>
              <IonIcon icon={saveOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="max-w-2xl mx-auto">
          {/* Profile Photo Section */}
          <IonCard>
            <IonCardContent className="text-center">
              <div className="mb-4">
                <IonAvatar className="w-24 h-24 mx-auto mb-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile Preview" />
                  ) : user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" />
                  ) : (
                    <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </IonAvatar>
                
                {selectedPhoto ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">
                      Selected: {selectedPhoto.name}
                    </div>
                    {isUploadingPhoto && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                    <div className="flex gap-2 justify-center">
                      <IonButton 
                        fill="solid" 
                        size="small" 
                        onClick={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                      >
                        <IonIcon icon={saveOutline} slot="start" />
                        {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </IonButton>
                      <IonButton 
                        fill="outline" 
                        size="small" 
                        onClick={cancelPhotoSelection}
                        disabled={isUploadingPhoto}
                      >
                        Cancel
                      </IonButton>
                    </div>
                  </div>
                ) : (
                  <IonButton fill="outline" size="small" onClick={handleChangePhotoClick}>
                    <IonIcon icon={cameraOutline} slot="start" />
                    Change Photo
                  </IonButton>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Personal Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={personOutline} className="mr-2" />
                Personal Information
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">First Name *</IonLabel>
                  <IonInput
                    value={formData.firstName}
                    onIonInput={(e) => handleStringInputChange("firstName", e.detail.value!)}
                    placeholder="Enter your first name"
                    className={formErrors.firstName ? "ion-invalid" : ""}
                  />
                  {formErrors.firstName && (
                    <IonLabel color="danger" className="text-sm mt-1">
                      {formErrors.firstName}
                    </IonLabel>
                  )}
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Last Name *</IonLabel>
                  <IonInput
                    value={formData.lastName}
                    onIonInput={(e) => handleStringInputChange("lastName", e.detail.value!)}
                    placeholder="Enter your last name"
                    className={formErrors.lastName ? "ion-invalid" : ""}
                  />
                  {formErrors.lastName && (
                    <IonLabel color="danger" className="text-sm mt-1">
                      {formErrors.lastName}
                    </IonLabel>
                  )}
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Email *</IonLabel>
                  <IonInput
                    type="email"
                    value={formData.email}
                    onIonInput={(e) => handleStringInputChange("email", e.detail.value!)}
                    placeholder="Enter your email"
                    className={formErrors.email ? "ion-invalid" : ""}
                  />
                  {formErrors.email && (
                    <IonLabel color="danger" className="text-sm mt-1">
                      {formErrors.email}
                    </IonLabel>
                  )}
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Phone Number *</IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.phone}
                    onIonInput={(e) => handleStringInputChange("phone", e.detail.value!)}
                    placeholder="Enter your phone number"
                    className={formErrors.phone ? "ion-invalid" : ""}
                  />
                  {formErrors.phone && (
                    <IonLabel color="danger" className="text-sm mt-1">
                      {formErrors.phone}
                    </IonLabel>
                  )}
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Business Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={businessOutline} className="mr-2" />
                Business Information
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Business Name (Optional)</IonLabel>
                  <IonInput
                    value={formData.businessName}
                    onIonInput={(e) => handleStringInputChange("businessName", e.detail.value!)}
                    placeholder="Enter your business name"
                  />
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Skills */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={checkmarkCircleOutline} className="mr-2" />
                Skills *
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_SKILLS.map((skill) => (
                  <IonItem key={skill.id} button onClick={() => handleSkillToggle(skill.name)}>
                    <IonCheckbox
                      checked={formData.skills.includes(skill.name)}
                      onIonChange={() => handleSkillToggle(skill.name)}
                    />
                    <IonLabel className="ml-3">
                      <h3>{skill.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{skill.category.replace('_', ' ')}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </div>
              {formErrors.skills && (
                <IonLabel color="danger" className="text-sm mt-2 block">
                  {formErrors.skills}
                </IonLabel>
              )}
            </IonCardContent>
          </IonCard>

          {/* Emergency Contact */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={callOutline} className="mr-2" />
                Emergency Contact
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Contact Name</IonLabel>
                  <IonInput
                    value={formData.emergencyContactName}
                    onIonInput={(e) => handleStringInputChange("emergencyContactName", e.detail.value!)}
                    placeholder="Enter emergency contact name"
                    className={formErrors.emergencyContactName ? "ion-invalid" : ""}
                  />
                  {formErrors.emergencyContactName && (
                    <IonLabel color="danger" className="text-sm mt-1">
                      {formErrors.emergencyContactName}
                    </IonLabel>
                  )}
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Contact Phone</IonLabel>
                  <IonInput
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onIonInput={(e) => handleStringInputChange("emergencyContactPhone", e.detail.value!)}
                    placeholder="Enter emergency contact phone"
                    className={formErrors.emergencyContactPhone ? "ion-invalid" : ""}
                  />
                  {formErrors.emergencyContactPhone && (
                    <IonLabel color="danger" className="text-sm mt-1">
                      {formErrors.emergencyContactPhone}
                    </IonLabel>
                  )}
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Relationship</IonLabel>
                  <IonSelect
                    value={formData.emergencyContactRelationship}
                    onIonChange={(e: CustomEvent) => handleStringInputChange("emergencyContactRelationship", e.detail.value)}
                    placeholder="Select relationship"
                  >
                    {RELATIONSHIP_OPTIONS.map((relationship) => (
                      <IonSelectOption key={relationship} value={relationship}>
                        {relationship}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Save Button */}
          <div className="mt-6 mb-8">
            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={isLoading}
              className="h-12"
            >
              <IonIcon icon={saveOutline} slot="start" />
              Save Changes
            </IonButton>
          </div>
        </div>

        <IonLoading isOpen={isLoading} message="Updating profile..." />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;
