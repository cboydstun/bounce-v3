import {
  NativeBiometric,
  BiometryType,
} from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import {
  BiometricAuthResult,
  BiometricAvailabilityResult,
  BiometricPromptOptions,
  BiometricCredentials,
  BiometricSettings,
  BiometryType as CustomBiometryType,
  BiometricErrorCode,
} from "../../types/biometric.types";
import { secureStorage } from "../storage/secureStorage";
import { APP_CONFIG } from "../../config/app.config";
import {
  biometricLogger,
  logBiometricOperation,
} from "../../utils/biometricLogger";

class BiometricService {
  private isNative: boolean;
  private isInitialized: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize biometric service
   */
  async initialize(): Promise<void> {
    return logBiometricOperation("initialize", async () => {
      if (this.isInitialized) {
        biometricLogger.debug("Initialize", "Already initialized, skipping");
        return;
      }

      biometricLogger.info(
        "Initialize",
        "Starting biometric service initialization",
        {
          isNative: this.isNative,
          platform: Capacitor.getPlatform(),
        },
      );

      try {
        if (this.isNative) {
          biometricLogger.debug(
            "Initialize",
            "Checking biometric availability on native platform",
          );
          // Check if biometric is available on device initialization
          await this.isAvailable();
        } else {
          biometricLogger.warn(
            "Initialize",
            "Running on web platform - biometric features limited",
          );
        }

        this.isInitialized = true;
        biometricLogger.info(
          "Initialize",
          "Biometric service initialized successfully",
        );
      } catch (error) {
        biometricLogger.error(
          "Initialize",
          "Biometric service initialization failed",
          error,
        );
        this.isInitialized = true; // Continue without biometric support
        throw error;
      }
    });
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<BiometricAvailabilityResult> {
    return logBiometricOperation("isAvailable", async () => {
      biometricLogger.debug("Availability", "Checking biometric availability", {
        isNative: this.isNative,
        platform: Capacitor.getPlatform(),
      });

      if (!this.isNative) {
        const result = {
          isAvailable: false,
          reason:
            "Biometric authentication is only available on native platforms",
        };
        biometricLogger.warn("Availability", "Not on native platform", result);
        return result;
      }

      try {
        biometricLogger.logNativeCall("NativeBiometric.isAvailable");
        const result = await NativeBiometric.isAvailable();
        biometricLogger.logNativeResponse(
          "NativeBiometric.isAvailable",
          result,
        );

        const mappedResult = {
          isAvailable: result.isAvailable,
          biometryType: this.mapBiometryType(result.biometryType),
          strongBiometryIsAvailable: (result as any).strongBiometryIsAvailable,
          reason: (result as any).errorMessage,
        };

        biometricLogger.info(
          "Availability",
          "Biometric availability check completed",
          {
            ...mappedResult,
            rawResult: result,
          },
        );

        return mappedResult;
      } catch (error) {
        biometricLogger.logNativeResponse(
          "NativeBiometric.isAvailable",
          undefined,
          error,
        );
        const result = {
          isAvailable: false,
          reason: `Biometric check failed: ${error}`,
        };
        biometricLogger.error(
          "Availability",
          "Biometric availability check failed",
          {
            error,
            result,
          },
        );
        return result;
      }
    });
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(
    options: BiometricPromptOptions,
  ): Promise<BiometricAuthResult> {
    return logBiometricOperation("authenticate", async () => {
      biometricLogger.info(
        "Authenticate",
        "Starting biometric authentication",
        {
          options: {
            ...options,
            // Don't log sensitive data, just structure
            hasReason: !!options.reason,
            hasTitle: !!options.title,
            maxAttempts: options.maxAttempts,
          },
          isNative: this.isNative,
          platform: Capacitor.getPlatform(),
        },
      );

      if (!this.isNative) {
        const result = {
          success: false,
          error:
            "Biometric authentication is only available on native platforms",
          errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
        };
        biometricLogger.warn("Authenticate", "Not on native platform", result);
        return result;
      }

      try {
        biometricLogger.debug("Authenticate", "Initializing biometric service");
        await this.initialize();

        biometricLogger.debug(
          "Authenticate",
          "Checking biometric availability",
        );
        const availability = await this.isAvailable();

        if (!availability.isAvailable) {
          const result = {
            success: false,
            error:
              availability.reason || "Biometric authentication not available",
            errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
          };
          biometricLogger.error("Authenticate", "Biometric not available", {
            availability,
            result,
          });
          return result;
        }

        biometricLogger.info(
          "Authenticate",
          "Biometric available, proceeding with authentication",
          {
            biometryType: availability.biometryType,
            strongBiometryIsAvailable: availability.strongBiometryIsAvailable,
          },
        );

        const verifyParams = {
          reason: options.reason,
          title: options.title || "Biometric Authentication",
          subtitle: options.subtitle || "Use your biometric to authenticate",
          description:
            options.description ||
            "Place your finger on the sensor or look at the camera",
          fallbackTitle: options.fallbackTitle || "Use Password",
          negativeButtonText: options.negativeButtonText || "Cancel",
          maxAttempts: options.maxAttempts || 3,
        };

        biometricLogger.debug(
          "Authenticate",
          "Calling NativeBiometric.verifyIdentity",
          {
            params: verifyParams,
          },
        );

        biometricLogger.logNativeCall(
          "NativeBiometric.verifyIdentity",
          verifyParams,
        );
        const result = await NativeBiometric.verifyIdentity(verifyParams);
        biometricLogger.logNativeResponse(
          "NativeBiometric.verifyIdentity",
          result,
        );

        biometricLogger.info(
          "Authenticate",
          "Biometric authentication successful",
        );

        // Update last used timestamp
        biometricLogger.debug("Authenticate", "Updating last used timestamp");
        await this.updateLastUsed();

        const successResult = { success: true };
        biometricLogger.info(
          "Authenticate",
          "Authentication completed successfully",
          successResult,
        );
        return successResult;
      } catch (error: any) {
        biometricLogger.logNativeResponse(
          "NativeBiometric.verifyIdentity",
          undefined,
          error,
        );

        const errorCode = this.mapErrorCode(error.code || error.message);

        biometricLogger.error(
          "Authenticate",
          "Biometric authentication failed",
          {
            error: {
              message: error.message,
              code: error.code,
              name: error.name,
              stack: error.stack,
            },
            mappedErrorCode: errorCode,
            originalError: error,
          },
        );

        // Track failure count
        biometricLogger.debug("Authenticate", "Incrementing failure count");
        try {
          await this.incrementFailureCount();
        } catch (incrementError) {
          biometricLogger.warn(
            "Authenticate",
            "Failed to increment failure count",
            incrementError,
          );
        }

        const failureResult = {
          success: false,
          error: error.message || "Biometric authentication failed",
          errorCode,
        };

        biometricLogger.error(
          "Authenticate",
          "Authentication failed with result",
          failureResult,
        );
        return failureResult;
      }
    });
  }

  /**
   * Set up biometric credentials for the first time
   */
  async setupBiometric(
    credentials: BiometricCredentials,
  ): Promise<BiometricAuthResult> {
    try {
      if (!this.isNative) {
        return {
          success: false,
          error: "Biometric setup is only available on native platforms",
          errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
        };
      }

      await this.initialize();

      const availability = await this.isAvailable();
      if (!availability.isAvailable) {
        return {
          success: false,
          error:
            availability.reason || "Biometric authentication not available",
          errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
        };
      }

      // First, authenticate to ensure user can use biometric
      const authResult = await this.authenticate({
        reason: "Set up biometric authentication for quick login",
        title: "Enable Biometric Login",
        subtitle: "Authenticate to enable biometric login",
      });

      if (!authResult.success) {
        return authResult;
      }

      // Store credentials securely
      await secureStorage.storeBiometricCredentials(credentials);

      // Update settings
      const settings: BiometricSettings = {
        enabled: true,
        enrolledAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        failureCount: 0,
        maxFailures: 5,
      };

      await secureStorage.storeBiometricSettings(settings);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error("Biometric setup failed:", error);
      return {
        success: false,
        error: error.message || "Failed to set up biometric authentication",
        errorCode: this.mapErrorCode(error.code || error.message),
      };
    }
  }

  /**
   * Authenticate and retrieve stored credentials
   */
  async authenticateAndGetCredentials(
    options: BiometricPromptOptions,
  ): Promise<{
    success: boolean;
    credentials?: BiometricCredentials;
    error?: string;
    errorCode?: BiometricErrorCode;
  }> {
    try {
      // First authenticate with biometric
      const authResult = await this.authenticate(options);

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
          errorCode: authResult.errorCode,
        };
      }

      // Retrieve stored credentials
      const credentials = await secureStorage.getBiometricCredentials();

      if (!credentials) {
        return {
          success: false,
          error: "No biometric credentials found",
          errorCode: BiometricErrorCode.AUTHENTICATION_FAILED,
        };
      }

      return {
        success: true,
        credentials,
      };
    } catch (error: any) {
      console.error(
        "Biometric authentication and credential retrieval failed:",
        error,
      );
      return {
        success: false,
        error:
          error.message || "Failed to authenticate and retrieve credentials",
        errorCode: this.mapErrorCode(error.code || error.message),
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    try {
      // Remove stored credentials
      await secureStorage.removeBiometricCredentials();

      // Update settings
      const settings: BiometricSettings = {
        enabled: false,
        enrolledAt: undefined,
        lastUsedAt: undefined,
        failureCount: 0,
        maxFailures: 5,
      };

      await secureStorage.storeBiometricSettings(settings);
    } catch (error) {
      console.error("Failed to disable biometric authentication:", error);
      throw error;
    }
  }

  /**
   * Check if biometric is enabled for the user
   */
  async isEnabled(): Promise<boolean> {
    try {
      const settings = await secureStorage.getBiometricSettings();
      return settings.enabled === true;
    } catch (error) {
      console.error("Failed to check biometric enabled status:", error);
      return false;
    }
  }

  /**
   * Get biometric settings
   */
  async getSettings(): Promise<BiometricSettings> {
    try {
      return await secureStorage.getBiometricSettings();
    } catch (error) {
      console.error("Failed to get biometric settings:", error);
      return {
        enabled: false,
        failureCount: 0,
        maxFailures: 5,
      };
    }
  }

  /**
   * Update stored credentials (for token refresh)
   */
  async updateCredentials(
    credentials: Partial<BiometricCredentials>,
  ): Promise<void> {
    try {
      const existingCredentials = await secureStorage.getBiometricCredentials();

      if (!existingCredentials) {
        throw new Error("No existing biometric credentials found");
      }

      const updatedCredentials: BiometricCredentials = {
        ...existingCredentials,
        ...credentials,
      };

      await secureStorage.storeBiometricCredentials(updatedCredentials);
    } catch (error) {
      console.error("Failed to update biometric credentials:", error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication should be offered
   */
  async shouldOfferBiometric(): Promise<boolean> {
    try {
      if (!this.isNative) return false;

      const availability = await this.isAvailable();
      if (!availability.isAvailable) return false;

      const isEnabled = await this.isEnabled();
      if (isEnabled) return false; // Already set up

      // Check if user has previously declined
      const settings = await this.getSettings();
      if (
        settings.failureCount &&
        settings.failureCount >= (settings.maxFailures || 5)
      ) {
        return false; // Too many failures
      }

      return true;
    } catch (error) {
      console.error("Failed to check if should offer biometric:", error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private mapBiometryType(nativeType?: BiometryType): CustomBiometryType {
    switch (nativeType) {
      case BiometryType.TOUCH_ID:
        return CustomBiometryType.TOUCH_ID;
      case BiometryType.FACE_ID:
        return CustomBiometryType.FACE_ID;
      case BiometryType.FINGERPRINT:
        return CustomBiometryType.FINGERPRINT;
      case BiometryType.FACE_AUTHENTICATION:
        return CustomBiometryType.FACE_AUTHENTICATION;
      case BiometryType.IRIS_AUTHENTICATION:
        return CustomBiometryType.IRIS_AUTHENTICATION;
      case BiometryType.MULTIPLE:
        return CustomBiometryType.MULTIPLE;
      default:
        return CustomBiometryType.NONE;
    }
  }

  private mapErrorCode(errorCode: string | number): BiometricErrorCode {
    // Map native error codes to our custom error codes
    if (typeof errorCode === "string") {
      if (errorCode.includes("cancel")) return BiometricErrorCode.USER_CANCEL;
      if (errorCode.includes("not available"))
        return BiometricErrorCode.BIOMETRY_NOT_AVAILABLE;
      if (errorCode.includes("not enrolled"))
        return BiometricErrorCode.BIOMETRY_NOT_ENROLLED;
      if (errorCode.includes("lockout"))
        return BiometricErrorCode.BIOMETRY_LOCKOUT;
      if (errorCode.includes("failed"))
        return BiometricErrorCode.AUTHENTICATION_FAILED;
    }

    // Default to unknown error
    return BiometricErrorCode.BIOMETRY_UNKNOWN_ERROR;
  }

  private async updateLastUsed(): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.lastUsedAt = new Date().toISOString();
      settings.failureCount = 0; // Reset failure count on successful auth
      await secureStorage.storeBiometricSettings(settings);
    } catch (error) {
      console.warn("Failed to update last used timestamp:", error);
    }
  }

  private async incrementFailureCount(): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.failureCount = (settings.failureCount || 0) + 1;
      await secureStorage.storeBiometricSettings(settings);
    } catch (error) {
      console.warn("Failed to increment failure count:", error);
    }
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
