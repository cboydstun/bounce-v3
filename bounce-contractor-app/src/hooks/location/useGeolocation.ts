import { useState, useEffect, useCallback } from "react";
import { Geolocation, Position } from "@capacitor/geolocation";
import { APP_CONFIG } from "../../config/app.config";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface GeolocationState {
  location: LocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isWatching: boolean;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoStart?: boolean;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    autoStart = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
    hasPermission: false,
    isWatching: false,
  });

  const [watchId, setWatchId] = useState<string | null>(null);

  // Check and request permissions
  const checkPermissions = useCallback(async () => {
    try {
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location === "granted") {
        setState(prev => ({ ...prev, hasPermission: true }));
        return true;
      } else if (permissions.location === "prompt") {
        const requestResult = await Geolocation.requestPermissions();
        const granted = requestResult.location === "granted";
        setState(prev => ({ ...prev, hasPermission: granted }));
        return granted;
      } else {
        setState(prev => ({ 
          ...prev, 
          hasPermission: false,
          error: "Location permission denied"
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        hasPermission: false,
        error: `Permission check failed: ${error}`
      }));
      return false;
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback(async (): Promise<LocationCoordinates | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      };

      setState(prev => ({
        ...prev,
        location: coordinates,
        isLoading: false,
        error: null,
      }));

      return coordinates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get location";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [enableHighAccuracy, timeout, maximumAge, checkPermissions]);

  // Start watching position
  const startWatching = useCallback(async () => {
    if (state.isWatching || watchId) {
      return;
    }

    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        return;
      }

      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
        (position, error) => {
          if (error) {
            setState(prev => ({
              ...prev,
              error: error.message,
              isLoading: false,
            }));
            return;
          }

          if (position) {
            const coordinates: LocationCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            };

            setState(prev => ({
              ...prev,
              location: coordinates,
              isLoading: false,
              error: null,
            }));
          }
        }
      );

      setWatchId(id);
      setState(prev => ({ ...prev, isWatching: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start watching location";
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isWatching: false,
      }));
    }
  }, [state.isWatching, watchId, enableHighAccuracy, timeout, maximumAge, checkPermissions]);

  // Stop watching position
  const stopWatching = useCallback(async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
      setState(prev => ({ ...prev, isWatching: false }));
    }
  }, [watchId]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 3959; // Earth's radius in miles
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Get distance from current location
  const getDistanceFromCurrent = useCallback(
    (latitude: number, longitude: number): number | null => {
      if (!state.location) {
        return null;
      }
      return calculateDistance(
        state.location.latitude,
        state.location.longitude,
        latitude,
        longitude
      );
    },
    [state.location, calculateDistance]
  );

  // Initialize geolocation on mount
  useEffect(() => {
    if (autoStart) {
      getCurrentPosition();
    }
  }, [autoStart, getCurrentPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    calculateDistance,
    getDistanceFromCurrent,
    checkPermissions,
  };
};

// Hook for background location tracking
export const useBackgroundLocation = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<LocationCoordinates | null>(null);

  const startBackgroundTracking = useCallback(async () => {
    // This would integrate with Capacitor Background Mode plugin
    // For now, we'll use regular position watching
    setIsTracking(true);
  }, []);

  const stopBackgroundTracking = useCallback(async () => {
    setIsTracking(false);
  }, []);

  return {
    isTracking,
    lastKnownLocation,
    startBackgroundTracking,
    stopBackgroundTracking,
  };
};
