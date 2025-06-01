import { useState, useEffect, useCallback } from "react";
import { 
  geofencingService, 
  GeofenceConfig, 
  GeofenceEvent, 
  GeofenceStatus 
} from "../../services/location/geofencingService";
import { useAuthStore } from "../../store/authStore";

export interface GeofencingHookResult {
  // State
  isMonitoring: boolean;
  geofences: GeofenceConfig[];
  activeGeofences: GeofenceConfig[];
  lastEvent: GeofenceEvent | null;
  
  // Actions
  createGeofence: (config: Omit<GeofenceConfig, "id" | "createdAt">) => Promise<string>;
  updateGeofence: (id: string, updates: Partial<GeofenceConfig>) => Promise<void>;
  deleteGeofence: (id: string) => Promise<void>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  
  // Utilities
  getGeofencesForTask: (taskId: string) => GeofenceConfig[];
  getGeofenceStatus: (id: string) => GeofenceStatus | null;
  isInsideTaskGeofence: (taskId: string) => boolean;
  getCurrentLocation: () => Promise<any>;
}

export function useGeofencing(): GeofencingHookResult {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [geofences, setGeofences] = useState<GeofenceConfig[]>([]);
  const [activeGeofences, setActiveGeofences] = useState<GeofenceConfig[]>([]);
  const [lastEvent, setLastEvent] = useState<GeofenceEvent | null>(null);
  
  const user = useAuthStore((state) => state.user);

  // Update state when geofences change
  const updateGeofenceState = useCallback(() => {
    const allGeofences = geofencingService.getAllGeofences();
    const active = geofencingService.getActiveGeofences();
    const monitoring = geofencingService.isMonitoringActive();
    
    setGeofences(allGeofences);
    setActiveGeofences(active);
    setIsMonitoring(monitoring);
  }, []);

  // Set up event listener for geofence events
  useEffect(() => {
    const unsubscribe = geofencingService.addEventListener((event) => {
      setLastEvent(event);
      updateGeofenceState();
    });

    // Initial state update
    updateGeofenceState();

    return unsubscribe;
  }, [updateGeofenceState]);

  // Create geofence
  const createGeofence = useCallback(
    async (config: Omit<GeofenceConfig, "id" | "createdAt">) => {
      const geofenceId = await geofencingService.createGeofence(config);
      updateGeofenceState();
      return geofenceId;
    },
    [updateGeofenceState]
  );

  // Update geofence
  const updateGeofence = useCallback(
    async (id: string, updates: Partial<GeofenceConfig>) => {
      await geofencingService.updateGeofence(id, updates);
      updateGeofenceState();
    },
    [updateGeofenceState]
  );

  // Delete geofence
  const deleteGeofence = useCallback(
    async (id: string) => {
      await geofencingService.deleteGeofence(id);
      updateGeofenceState();
    },
    [updateGeofenceState]
  );

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    try {
      await geofencingService.startMonitoring();
      updateGeofenceState();
    } catch (error) {
      console.error("Failed to start geofence monitoring:", error);
      throw error;
    }
  }, [updateGeofenceState]);

  // Stop monitoring
  const stopMonitoring = useCallback(async () => {
    try {
      await geofencingService.stopMonitoring();
      updateGeofenceState();
    } catch (error) {
      console.error("Failed to stop geofence monitoring:", error);
      throw error;
    }
  }, [updateGeofenceState]);

  // Get geofences for task
  const getGeofencesForTask = useCallback((taskId: string) => {
    return geofencingService.getGeofencesForTask(taskId);
  }, []);

  // Get geofence status
  const getGeofenceStatus = useCallback((id: string) => {
    return geofencingService.getGeofenceStatus(id);
  }, []);

  // Check if inside task geofence
  const isInsideTaskGeofence = useCallback((taskId: string) => {
    return geofencingService.isInsideTaskGeofence(taskId);
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    return await geofencingService.getCurrentLocation();
  }, []);

  return {
    // State
    isMonitoring,
    geofences,
    activeGeofences,
    lastEvent,
    
    // Actions
    createGeofence,
    updateGeofence,
    deleteGeofence,
    startMonitoring,
    stopMonitoring,
    
    // Utilities
    getGeofencesForTask,
    getGeofenceStatus,
    isInsideTaskGeofence,
    getCurrentLocation,
  };
}

// Hook for task-specific geofencing
export function useTaskGeofencing(taskId: string) {
  const geofencing = useGeofencing();
  
  const taskGeofences = geofencing.getGeofencesForTask(taskId);
  const isInsideGeofence = geofencing.isInsideTaskGeofence(taskId);
  
  // Create geofence for this task
  const createTaskGeofence = useCallback(
    async (
      center: { latitude: number; longitude: number },
      radius: number = 100,
      name?: string
    ) => {
      return await geofencing.createGeofence({
        taskId,
        center,
        radius,
        name: name || `Task ${taskId} Geofence`,
        description: `Automatic geofence for task ${taskId}`,
        isActive: true,
      });
    },
    [geofencing, taskId]
  );

  // Delete all geofences for this task
  const clearTaskGeofences = useCallback(async () => {
    const taskGeofences = geofencing.getGeofencesForTask(taskId);
    for (const geofence of taskGeofences) {
      await geofencing.deleteGeofence(geofence.id);
    }
  }, [geofencing, taskId]);

  // Get distance to task location (if geofence exists)
  const getDistanceToTask = useCallback(() => {
    const taskGeofences = geofencing.getGeofencesForTask(taskId);
    if (taskGeofences.length === 0) return null;
    
    const geofence = taskGeofences[0]; // Use first geofence
    const status = geofencing.getGeofenceStatus(geofence.id);
    return status?.distance || null;
  }, [geofencing, taskId]);

  return {
    ...geofencing,
    // Task-specific data
    taskGeofences,
    isInsideGeofence,
    
    // Task-specific actions
    createTaskGeofence,
    clearTaskGeofences,
    getDistanceToTask,
  };
}
