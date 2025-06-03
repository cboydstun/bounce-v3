import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonCheckbox,
  IonInput,
  IonDatetime,
  IonList,
  IonListHeader,
  IonNote,
} from "@ionic/react";
import { close, checkmark, funnel } from "ionicons/icons";
import {
  TaskFilters as TaskFiltersType,
  TaskType,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "../../types/task.types";
import { useTaskTranslation } from "../../hooks/common/useI18n";
import { useGeolocation } from "../../hooks/location/useGeolocation";

interface TaskFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const { t } = useTaskTranslation();
  const { location } = useGeolocation();
  const [localFilters, setLocalFilters] = useState<TaskFiltersType>(filters);

  const taskTypes: TaskType[] = [
    "delivery_only",
    "setup_only",
    "delivery_and_setup",
    "pickup_only",
    "pickup_and_teardown",
    "full_service",
  ];

  const taskCategories: TaskCategory[] = [
    "bounce_house",
    "water_slide",
    "combo_unit",
    "obstacle_course",
    "interactive_game",
    "tent",
    "table_chair",
    "generator",
    "other",
  ];

  const taskPriorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

  const taskStatuses: TaskStatus[] = [
    "published",
    "assigned",
    "accepted",
    "in_progress",
  ];

  const handleFilterChange = (key: keyof TaskFiltersType, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const handleApply = () => {
    // TEMPORARILY DISABLED: Comment out all filters to debug
    // onFiltersChange(localFilters);
    onFiltersChange({}); // Always pass empty filters
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: TaskFiltersType = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClearFilters();
  };

  const handleClose = () => {
    setLocalFilters(filters); // Reset to original filters
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("filters.title")}</IonTitle>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleClear}>
              {t("filters.clear")}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          {/* Task Types */}
          <IonListHeader>
            <IonLabel>{t("filters.taskTypes")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonSelect
              placeholder={t("filters.selectTaskTypes")}
              multiple={true}
              value={localFilters.type || []}
              onIonChange={(e) => {
                const value = e.detail.value;
                if (!value || value.length === 0) {
                  const newFilters = { ...localFilters };
                  delete newFilters.type;
                  setLocalFilters(newFilters);
                } else {
                  handleFilterChange("type", value);
                }
              }}
            >
              {taskTypes.map((type) => (
                <IonSelectOption key={type} value={type}>
                  {t(`taskTypes.${type}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Task Categories */}
          <IonListHeader>
            <IonLabel>{t("filters.categories")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonSelect
              placeholder={t("filters.selectCategories")}
              multiple={true}
              value={localFilters.category || []}
              onIonChange={(e) => {
                const value = e.detail.value;
                if (!value || value.length === 0) {
                  const newFilters = { ...localFilters };
                  delete newFilters.category;
                  setLocalFilters(newFilters);
                } else {
                  handleFilterChange("category", value);
                }
              }}
            >
              {taskCategories.map((category) => (
                <IonSelectOption key={category} value={category}>
                  {t(`categories.${category}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Priority */}
          <IonListHeader>
            <IonLabel>{t("filters.priority")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonSelect
              placeholder={t("filters.selectPriority")}
              multiple={true}
              value={localFilters.priority || []}
              onIonChange={(e) => {
                const value = e.detail.value;
                if (!value || value.length === 0) {
                  const newFilters = { ...localFilters };
                  delete newFilters.priority;
                  setLocalFilters(newFilters);
                } else {
                  handleFilterChange("priority", value);
                }
              }}
            >
              {taskPriorities.map((priority) => (
                <IonSelectOption key={priority} value={priority}>
                  {t(`priority.${priority}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Status */}
          <IonListHeader>
            <IonLabel>{t("filters.status")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonSelect
              placeholder={t("filters.selectStatus")}
              multiple={true}
              value={localFilters.status || []}
              onIonChange={(e) => {
                const value = e.detail.value;
                if (!value || value.length === 0) {
                  const newFilters = { ...localFilters };
                  delete newFilters.status;
                  setLocalFilters(newFilters);
                } else {
                  handleFilterChange("status", value);
                }
              }}
            >
              {taskStatuses.map((status) => (
                <IonSelectOption key={status} value={status}>
                  {t(`status.${status}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Compensation Range */}
          <IonListHeader>
            <IonLabel>{t("filters.compensation")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel position="stacked">
              {t("filters.minCompensation")}
            </IonLabel>
            <IonInput
              type="number"
              placeholder="$0"
              value={localFilters.compensation?.min ?? ""}
              onIonInput={(e) => {
                const value = e.detail.value!.trim();
                if (value === "") {
                  const newCompensation = { ...localFilters.compensation };
                  delete newCompensation.min;
                  if (Object.keys(newCompensation).length === 0) {
                    const newFilters = { ...localFilters };
                    delete newFilters.compensation;
                    setLocalFilters(newFilters);
                  } else {
                    handleFilterChange("compensation", newCompensation);
                  }
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    handleFilterChange("compensation", {
                      ...localFilters.compensation,
                      min: numValue,
                    });
                  }
                }
              }}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">
              {t("filters.maxCompensation")}
            </IonLabel>
            <IonInput
              type="number"
              placeholder="$1000"
              value={localFilters.compensation?.max ?? ""}
              onIonInput={(e) => {
                const value = e.detail.value!.trim();
                if (value === "") {
                  const newCompensation = { ...localFilters.compensation };
                  delete newCompensation.max;
                  if (Object.keys(newCompensation).length === 0) {
                    const newFilters = { ...localFilters };
                    delete newFilters.compensation;
                    setLocalFilters(newFilters);
                  } else {
                    handleFilterChange("compensation", newCompensation);
                  }
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    handleFilterChange("compensation", {
                      ...localFilters.compensation,
                      max: numValue,
                    });
                  }
                }
              }}
            />
          </IonItem>

          {/* Duration Range */}
          <IonListHeader>
            <IonLabel>{t("filters.duration")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel position="stacked">
              {t("filters.minDuration")} (minutes)
            </IonLabel>
            <IonInput
              type="number"
              placeholder="30"
              value={localFilters.duration?.min ?? ""}
              onIonInput={(e) => {
                const value = e.detail.value!.trim();
                if (value === "") {
                  const newDuration = { ...localFilters.duration };
                  delete newDuration.min;
                  if (Object.keys(newDuration).length === 0) {
                    const newFilters = { ...localFilters };
                    delete newFilters.duration;
                    setLocalFilters(newFilters);
                  } else {
                    handleFilterChange("duration", newDuration);
                  }
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    handleFilterChange("duration", {
                      ...localFilters.duration,
                      min: numValue,
                    });
                  }
                }
              }}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">
              {t("filters.maxDuration")} (minutes)
            </IonLabel>
            <IonInput
              type="number"
              placeholder="480"
              value={localFilters.duration?.max ?? ""}
              onIonInput={(e) => {
                const value = e.detail.value!.trim();
                if (value === "") {
                  const newDuration = { ...localFilters.duration };
                  delete newDuration.max;
                  if (Object.keys(newDuration).length === 0) {
                    const newFilters = { ...localFilters };
                    delete newFilters.duration;
                    setLocalFilters(newFilters);
                  } else {
                    handleFilterChange("duration", newDuration);
                  }
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    handleFilterChange("duration", {
                      ...localFilters.duration,
                      max: numValue,
                    });
                  }
                }
              }}
            />
          </IonItem>

          {/* Distance Filter */}
          <IonListHeader>
            <IonLabel>{t("filters.distance")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel position="stacked">
              {t("filters.maxDistance")} (miles)
            </IonLabel>
            <IonInput
              type="number"
              placeholder="25"
              value={localFilters.location?.radius ?? ""}
              onIonInput={(e) => {
                const value = e.detail.value!.trim();
                if (value === "") {
                  const newFilters = { ...localFilters };
                  delete newFilters.location;
                  setLocalFilters(newFilters);
                } else {
                  const radius = parseInt(value);
                  if (!isNaN(radius)) {
                    if (location) {
                      handleFilterChange("location", {
                        coordinates: {
                          latitude: location.latitude,
                          longitude: location.longitude,
                        },
                        radius,
                      });
                    } else {
                      handleFilterChange("location", {
                        ...localFilters.location,
                        radius,
                      });
                    }
                  }
                }
              }}
            />
            <IonNote slot="helper">{t("filters.distanceNote")}</IonNote>
          </IonItem>

          {/* Date Range */}
          <IonListHeader>
            <IonLabel>{t("filters.dateRange")}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel position="stacked">{t("filters.startDate")}</IonLabel>
            <IonDatetime
              value={localFilters.dateRange?.start || ""}
              onIonChange={(e) => {
                const value = e.detail.value as string;
                if (!value || value === "") {
                  const newDateRange = { ...localFilters.dateRange };
                  delete newDateRange.start;
                  if (Object.keys(newDateRange).length === 0) {
                    const newFilters = { ...localFilters };
                    delete newFilters.dateRange;
                    setLocalFilters(newFilters);
                  } else {
                    handleFilterChange("dateRange", newDateRange);
                  }
                } else {
                  handleFilterChange("dateRange", {
                    ...localFilters.dateRange,
                    start: value,
                  });
                }
              }}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t("filters.endDate")}</IonLabel>
            <IonDatetime
              value={localFilters.dateRange?.end || ""}
              onIonChange={(e) => {
                const value = e.detail.value as string;
                if (!value || value === "") {
                  const newDateRange = { ...localFilters.dateRange };
                  delete newDateRange.end;
                  if (Object.keys(newDateRange).length === 0) {
                    const newFilters = { ...localFilters };
                    delete newFilters.dateRange;
                    setLocalFilters(newFilters);
                  } else {
                    handleFilterChange("dateRange", newDateRange);
                  }
                } else {
                  handleFilterChange("dateRange", {
                    ...localFilters.dateRange,
                    end: value,
                  });
                }
              }}
            />
          </IonItem>
        </IonList>

        {/* Apply Button */}
        <div className="p-4">
          <IonButton expand="block" onClick={handleApply} className="mb-2">
            <IonIcon icon={checkmark} slot="start" />
            {t("filters.apply")}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default TaskFilters;
