import { useState, useEffect, useCallback } from "react";
import {
  backgroundLocationService,
  LocationUpdate,
  LocationTrackingConfig,
  LocationTrackingSession,
} from "../../services/location/backgroundLocation";
import { Position } from "@capacitor/geolocation";

export interface BackgroundLocationHookResult {
  // State
  isTracking: boolean;
  currentSession: LocationTrackingSession | null;
  lastPosition: Position | null;
  queuedUpdates: number;
  locationHistory: LocationUpdate[];

  // Actions
  startTracking: (config: LocationTrackingConfig) => Promise<string>;
  stopTracking: () => Promise<void>;
  getCurrentLocation: () => Promise<Position>;
  clearLocationHistory: () => Promise<void>;

  // Utilities
  getLocationHistory: (taskId?: string) => LocationUpdate[];
}

export function useBackgroundLocation(): BackgroundLocationHookResult {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] =
    useState<LocationTrackingSession | null>(null);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  const [queuedUpdates, setQueuedUpdates] = useState(0);
  const [locationHistory, setLocationHistory] = useState<LocationUpdate[]>([]);

  // Update state from service
  const updateState = useCallback(() => {
    const status = backgroundLocationService.getTrackingStatus();
    setIsTracking(status.isTracking);
    setCurrentSession(status.session);
    setLastPosition(status.lastPosition);
    setQueuedUpdates(status.queuedUpdates);
    setLocationHistory(backgroundLocationService.getLocationHistory());
  }, []);

  // Set up listeners
  useEffect(() => {
    // Listen for location updates
    const unsubscribeUpdates = backgroundLocationService.addUpdateListener(
      (update) => {
        setLocationHistory((prev) => [...prev, update]);
        updateState();
      },
    );

    // Listen for session changes
    const unsubscribeSession = backgroundLocationService.addSessionListener(
      (session) => {
        setCurrentSession(session);
        updateState();
      },
    );

    // Initial state update
    updateState();

    return () => {
      unsubscribeUpdates();
      unsubscribeSession();
    };
  }, [updateState]);

  // Start tracking
  const startTracking = useCallback(
    async (config: LocationTrackingConfig) => {
      try {
        const sessionId = await backgroundLocationService.startTracking(config);
        updateState();
        return sessionId;
      } catch (error) {
        console.error("Failed to start location tracking:", error);
        throw error;
      }
    },
    [updateState],
  );

  // Stop tracking
  const stopTracking = useCallback(async () => {
    try {
      await backgroundLocationService.stopTracking();
      updateState();
    } catch (error) {
      console.error("Failed to stop location tracking:", error);
      throw error;
    }
  }, [updateState]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    return await backgroundLocationService.getCurrentLocation();
  }, []);

  // Clear location history
  const clearLocationHistory = useCallback(async () => {
    await backgroundLocationService.clearLocationHistory();
    updateState();
  }, [updateState]);

  // Get location history
  const getLocationHistory = useCallback((taskId?: string) => {
    return backgroundLocationService.getLocationHistory(taskId);
  }, []);

  return {
    // State
    isTracking,
    currentSession,
    lastPosition,
    queuedUpdates,
    locationHistory,

    // Actions
    startTracking,
    stopTracking,
    getCurrentLocation,
    clearLocationHistory,

    // Utilities
    getLocationHistory,
  };
}

// Hook for task-specific location tracking
export function useTaskLocationTracking(taskId: string) {
  const backgroundLocation = useBackgroundLocation();

  // Check if currently tracking this task
  const isTrackingThisTask =
    backgroundLocation.currentSession?.taskId === taskId;

  // Get location history for this task
  const taskLocationHistory = backgroundLocation.getLocationHistory(taskId);

  // Start tracking for this task with default config
  const startTaskTracking = useCallback(
    async (customConfig?: Partial<LocationTrackingConfig>) => {
      const defaultConfig: LocationTrackingConfig = {
        taskId,
        updateInterval: 30000, // 30 seconds
        enableHighAccuracy: true,
        maxAge: 60000, // 1 minute
        timeout: 15000, // 15 seconds
        distanceFilter: 10, // 10 meters
        ...customConfig,
      };

      return await backgroundLocation.startTracking(defaultConfig);
    },
    [backgroundLocation, taskId],
  );

  // Stop tracking (only if tracking this task)
  const stopTaskTracking = useCallback(async () => {
    if (isTrackingThisTask) {
      await backgroundLocation.stopTracking();
    }
  }, [backgroundLocation, isTrackingThisTask]);

  // Get distance traveled for this task
  const getDistanceTraveled = useCallback(() => {
    const history = taskLocationHistory;
    if (history.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      totalDistance += calculateDistance(
        prev.location.latitude,
        prev.location.longitude,
        curr.location.latitude,
        curr.location.longitude,
      );
    }

    return totalDistance;
  }, [taskLocationHistory]);

  // Get tracking duration for this task
  const getTrackingDuration = useCallback(() => {
    if (!backgroundLocation.currentSession || !isTrackingThisTask) {
      return 0;
    }

    const startTime = new Date(backgroundLocation.currentSession.startTime);
    const endTime = backgroundLocation.currentSession.endTime
      ? new Date(backgroundLocation.currentSession.endTime)
      : new Date();

    return endTime.getTime() - startTime.getTime();
  }, [backgroundLocation.currentSession, isTrackingThisTask]);

  // Get average speed for this task
  const getAverageSpeed = useCallback(() => {
    const distance = getDistanceTraveled(); // in meters
    const duration = getTrackingDuration(); // in milliseconds

    if (duration === 0) return 0;

    const durationInHours = duration / (1000 * 60 * 60);
    const distanceInKm = distance / 1000;

    return distanceInKm / durationInHours; // km/h
  }, [getDistanceTraveled, getTrackingDuration]);

  return {
    ...backgroundLocation,
    // Task-specific state
    isTrackingThisTask,
    taskLocationHistory,

    // Task-specific actions
    startTaskTracking,
    stopTaskTracking,

    // Task-specific utilities
    getDistanceTraveled,
    getTrackingDuration,
    getAverageSpeed,
  };
}

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
