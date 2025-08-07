import { useEffect, useState, useCallback } from "react";
import { audioService } from "../../services/audio/audioService";
import {
  AudioAlert,
  SoundType,
  AudioPreferences,
  AudioServiceStatus,
} from "../../types/audio.types";
import { TaskPriority } from "../../types/task.types";

export interface UseAudioAlertsOptions {
  autoInitialize?: boolean;
  preloadSounds?: boolean;
}

export interface UseAudioAlertsReturn {
  isInitialized: boolean;
  isSupported: boolean;
  status: AudioServiceStatus;
  preferences: AudioPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  forceDestroy: () => void;
  playTaskAlert: (priority: TaskPriority) => Promise<void>;
  playAlert: (alert: AudioAlert) => Promise<void>;
  playSound: (soundType: SoundType, volume?: number) => Promise<void>;
  testAudio: (soundType?: SoundType) => Promise<void>;
  updatePreferences: (preferences: Partial<AudioPreferences>) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Hook for managing audio alerts in the contractor app
 */
export const useAudioAlerts = (
  options: UseAudioAlertsOptions = {},
): UseAudioAlertsReturn => {
  const { autoInitialize = true, preloadSounds = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<AudioServiceStatus>(
    audioService.getStatus(),
  );
  const [preferences, setPreferences] = useState<AudioPreferences>(
    audioService.getPreferences(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize audio service
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (isInitialized) {
      console.log("Audio service already initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await audioService.initialize();

      if (preloadSounds) {
        await audioService.preloadSounds();
      }

      setIsInitialized(true);
      setStatus(audioService.getStatus());
      setPreferences(audioService.getPreferences());

      console.log("Audio alerts initialized successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize audio alerts";
      setError(errorMessage);
      console.error("Audio alerts initialization failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, preloadSounds]);

  /**
   * Play alert based on task priority
   */
  const playTaskAlert = useCallback(
    async (priority: TaskPriority): Promise<void> => {
      if (!isInitialized) {
        console.warn("Audio service not initialized");
        return;
      }

      const soundTypeMap: Record<TaskPriority, SoundType> = {
        low: "new_task_low",
        medium: "new_task_medium",
        high: "new_task_high",
        urgent: "new_task_urgent",
      };

      const vibrationPatterns: Record<TaskPriority, number[]> = {
        low: [200],
        medium: [200, 100, 200],
        high: [300, 100, 300, 100, 300],
        urgent: [500, 100, 500, 100, 500, 100, 500],
      };

      const alert: AudioAlert = {
        soundType: soundTypeMap[priority],
        vibrationPattern: vibrationPatterns[priority],
        fadeIn: priority === "urgent",
      };

      try {
        await audioService.playAlert(alert);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to play task alert";
        setError(errorMessage);
        console.error("Task alert failed:", err);
      }
    },
    [isInitialized],
  );

  /**
   * Play custom audio alert
   */
  const playAlert = useCallback(
    async (alert: AudioAlert): Promise<void> => {
      if (!isInitialized) {
        console.warn("Audio service not initialized");
        return;
      }

      try {
        await audioService.playAlert(alert);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to play audio alert";
        setError(errorMessage);
        console.error("Audio alert failed:", err);
      }
    },
    [isInitialized],
  );

  /**
   * Play specific sound
   */
  const playSound = useCallback(
    async (soundType: SoundType, volume?: number): Promise<void> => {
      if (!isInitialized) {
        console.warn("Audio service not initialized");
        return;
      }

      try {
        await audioService.playSound(soundType, { volume });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to play sound";
        setError(errorMessage);
        console.error("Sound playback failed:", err);
      }
    },
    [isInitialized],
  );

  /**
   * Test audio playback
   */
  const testAudio = useCallback(
    async (soundType: SoundType = "notification_general"): Promise<void> => {
      if (!isInitialized) {
        console.warn("Audio service not initialized");
        return;
      }

      try {
        await audioService.testAudio(soundType);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to test audio";
        setError(errorMessage);
        console.error("Audio test failed:", err);
      }
    },
    [isInitialized],
  );

  /**
   * Update audio preferences
   */
  const updatePreferences = useCallback(
    (newPreferences: Partial<AudioPreferences>): void => {
      audioService.updatePreferences(newPreferences);
      setPreferences(audioService.getPreferences());
    },
    [],
  );

  /**
   * Stop current audio playback
   */
  const stop = useCallback((): void => {
    audioService.stop();
    setStatus(audioService.getStatus());
  }, []);

  /**
   * Pause current audio playback
   */
  const pause = useCallback((): void => {
    audioService.pause();
    setStatus(audioService.getStatus());
  }, []);

  /**
   * Resume paused audio playback
   */
  const resume = useCallback((): void => {
    audioService.resume();
    setStatus(audioService.getStatus());
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize().catch(console.error);
    }
  }, [autoInitialize, isInitialized, initialize]);

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      setStatus(audioService.getStatus());
    };

    // Update immediately
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 10000); // Clear error after 10 seconds

      return () => clearTimeout(timeout);
    }
  }, [error]);

  /**
   * Destroy audio alerts system
   */
  const destroy = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await audioService.destroy();
      setIsInitialized(false);
      setStatus(audioService.getStatus());
      setPreferences(audioService.getPreferences());
      console.log("Audio alerts destroyed successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to destroy audio alerts";
      setError(errorMessage);
      console.error("Audio alerts destruction failed:", err);

      // Force cleanup if graceful destruction failed
      try {
        audioService.forceDestroy();
        setIsInitialized(false);
        setStatus(audioService.getStatus());
        console.log("Audio alerts force destroyed");
      } catch (forceError) {
        console.error("Force destruction also failed:", forceError);
        throw forceError;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Force destroy audio alerts system
   */
  const forceDestroy = useCallback((): void => {
    audioService.forceDestroy();
    setIsInitialized(false);
    setStatus(audioService.getStatus());
    setPreferences(audioService.getPreferences());
    setError(null);
    console.log("Audio alerts force destroyed");
  }, []);

  return {
    isInitialized,
    isSupported: status.isSupported,
    status,
    preferences,
    isLoading,
    error,
    // Actions
    initialize,
    destroy,
    forceDestroy,
    playTaskAlert,
    playAlert,
    playSound,
    testAudio,
    updatePreferences,
    stop,
    pause,
    resume,
  };
};

/**
 * Helper function to get sound type from task priority
 */
export const getSoundTypeFromPriority = (priority: TaskPriority): SoundType => {
  const soundTypeMap: Record<TaskPriority, SoundType> = {
    low: "new_task_low",
    medium: "new_task_medium",
    high: "new_task_high",
    urgent: "new_task_urgent",
  };

  return soundTypeMap[priority];
};

/**
 * Helper function to get vibration pattern from task priority
 */
export const getVibrationPatternFromPriority = (
  priority: TaskPriority,
): number[] => {
  const vibrationPatterns: Record<TaskPriority, number[]> = {
    low: [200],
    medium: [200, 100, 200],
    high: [300, 100, 300, 100, 300],
    urgent: [500, 100, 500, 100, 500, 100, 500],
  };

  return vibrationPatterns[priority];
};
