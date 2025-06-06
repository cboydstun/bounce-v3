import { useState, useEffect, useCallback } from "react";
import { biometricService } from "../../services/auth/biometricService";
import {
  BiometricAuthResult,
  BiometricAvailabilityResult,
  BiometricPromptOptions,
  BiometricCredentials,
  BiometricSettings,
} from "../../types/biometric.types";

interface UseBiometricReturn {
  // State
  isAvailable: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  settings: BiometricSettings | null;
  availability: BiometricAvailabilityResult | null;

  // Actions
  checkAvailability: () => Promise<void>;
  authenticate: (
    options: BiometricPromptOptions,
  ) => Promise<BiometricAuthResult>;
  setupBiometric: (
    credentials: BiometricCredentials,
  ) => Promise<BiometricAuthResult>;
  authenticateAndGetCredentials: (options: BiometricPromptOptions) => Promise<{
    success: boolean;
    credentials?: BiometricCredentials;
    error?: string;
  }>;
  enableBiometric: (credentials: BiometricCredentials) => Promise<boolean>;
  disableBiometric: () => Promise<boolean>;
  updateCredentials: (
    credentials: Partial<BiometricCredentials>,
  ) => Promise<boolean>;
  shouldOfferSetup: () => Promise<boolean>;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useBiometric = (): UseBiometricReturn => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BiometricSettings | null>(null);
  const [availability, setAvailability] =
    useState<BiometricAvailabilityResult | null>(null);

  /**
   * Check biometric availability
   */
  const checkAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const availabilityResult = await biometricService.isAvailable();
      setAvailability(availabilityResult);
      setIsAvailable(availabilityResult.isAvailable);

      if (!availabilityResult.isAvailable && availabilityResult.reason) {
        setError(availabilityResult.reason);
      }
    } catch (err: any) {
      setError(err.message || "Failed to check biometric availability");
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if biometric is enabled
   */
  const checkEnabled = useCallback(async () => {
    try {
      const enabled = await biometricService.isEnabled();
      setIsEnabled(enabled);

      const biometricSettings = await biometricService.getSettings();
      setSettings(biometricSettings);
    } catch (err: any) {
      console.warn("Failed to check biometric enabled status:", err);
      setIsEnabled(false);
    }
  }, []);

  /**
   * Authenticate with biometric
   */
  const authenticate = useCallback(
    async (options: BiometricPromptOptions): Promise<BiometricAuthResult> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await biometricService.authenticate(options);

        if (!result.success && result.error) {
          setError(result.error);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Biometric authentication failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Set up biometric authentication
   */
  const setupBiometric = useCallback(
    async (credentials: BiometricCredentials): Promise<BiometricAuthResult> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await biometricService.setupBiometric(credentials);

        if (result.success) {
          setIsEnabled(true);
          await checkEnabled(); // Refresh settings
        } else if (result.error) {
          setError(result.error);
        }

        return result;
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to set up biometric authentication";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [checkEnabled],
  );

  /**
   * Authenticate and get stored credentials
   */
  const authenticateAndGetCredentials = useCallback(
    async (options: BiometricPromptOptions) => {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await biometricService.authenticateAndGetCredentials(options);

        if (!result.success && result.error) {
          setError(result.error);
        }

        return result;
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to authenticate and retrieve credentials";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Enable biometric authentication (alias for setupBiometric)
   */
  const enableBiometric = useCallback(
    async (credentials: BiometricCredentials): Promise<boolean> => {
      const result = await setupBiometric(credentials);
      return result.success;
    },
    [setupBiometric],
  );

  /**
   * Disable biometric authentication
   */
  const disableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      await biometricService.disableBiometric();
      setIsEnabled(false);
      await checkEnabled(); // Refresh settings

      return true;
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to disable biometric authentication";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkEnabled]);

  /**
   * Update stored biometric credentials
   */
  const updateCredentials = useCallback(
    async (credentials: Partial<BiometricCredentials>): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        await biometricService.updateCredentials(credentials);
        return true;
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to update biometric credentials";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Check if biometric setup should be offered to user
   */
  const shouldOfferSetup = useCallback(async (): Promise<boolean> => {
    try {
      return await biometricService.shouldOfferBiometric();
    } catch (err: any) {
      console.warn("Failed to check if should offer biometric setup:", err);
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh all biometric state
   */
  const refresh = useCallback(async () => {
    await Promise.all([checkAvailability(), checkEnabled()]);
  }, [checkAvailability, checkEnabled]);

  // Initialize on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // State
    isAvailable,
    isEnabled,
    isLoading,
    error,
    settings,
    availability,

    // Actions
    checkAvailability,
    authenticate,
    setupBiometric,
    authenticateAndGetCredentials,
    enableBiometric,
    disableBiometric,
    updateCredentials,
    shouldOfferSetup,

    // Utilities
    clearError,
    refresh,
  };
};

export default useBiometric;
