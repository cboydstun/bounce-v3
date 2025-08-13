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
    if (this.isInitialized) {
      return;
    }

    console.log("🔐 Initializing biometric service", {
      isNative: this.isNative,
      platform: Capacitor.getPlatform(),
    });

    try {
      if (this.isNative) {
        // Just check if biometric is available - don't fail initialization
        await this.isAvailable();
      }
      this.isInitialized = true;
      console.log("✅ Biometric service initialized");
    } catch (error) {
      console.warn("⚠️ Biometric service initialization failed:", error);
      this.isInitialized = true; // Continue without biometric support
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<BiometricAvailabilityResult> {
    console.log("🔍 Checking biometric availability");

    if (!this.isNative) {
      return {
        isAvailable: false,
        reason:
          "Biometric authentication is only available on native platforms",
      };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      console.log("📱 Native biometric check result:", result);

      return {
        isAvailable: result.isAvailable,
        biometryType: this.mapBiometryType(result.biometryType),
        strongBiometryIsAvailable: (result as any).strongBiometryIsAvailable,
        reason: (result as any).errorMessage,
      };
    } catch (error) {
      console.error("❌ Biometric availability check failed:", error);
      return {
        isAvailable: false,
        reason: `Biometric check failed: ${error}`,
      };
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(
    options: BiometricPromptOptions,
  ): Promise<BiometricAuthResult> {
    console.log("🔐 Starting biometric authentication");

    if (!this.isNative) {
      return {
        success: false,
        error: "Biometric authentication is only available on native platforms",
        errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
      };
    }

    try {
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

      console.log("📱 Calling NativeBiometric.verifyIdentity");
      await NativeBiometric.verifyIdentity(verifyParams);

      console.log("✅ Biometric authentication successful");
      await this.updateLastUsed();

      return { success: true };
    } catch (error: any) {
      console.error("❌ Biometric authentication failed:", error);

      await this.incrementFailureCount();

      return {
        success: false,
        error: error.message || "Biometric authentication failed",
        errorCode: this.mapErrorCode(error.code || error.message),
      };
    }
  }

  /**
   * Set up biometric credentials for the first time
   */
  async setupBiometric(
    credentials: BiometricCredentials,
  ): Promise<BiometricAuthResult> {
    console.log("🔧 Setting up biometric authentication");

    if (!this.isNative) {
      return {
        success: false,
        error: "Biometric setup is only available on native platforms",
        errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
      };
    }

    // Validate credentials
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        error: "Username and password are required for biometric setup",
        errorCode: BiometricErrorCode.AUTHENTICATION_FAILED,
      };
    }

    try {
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
      console.log("💾 Storing biometric credentials");
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

      // Verify the setup worked
      const storedCredentials = await secureStorage.getBiometricCredentials();
      if (!storedCredentials) {
        throw new Error("Failed to verify credential storage");
      }

      console.log("✅ Biometric setup completed successfully");
      return { success: true };
    } catch (error: any) {
      console.error("❌ Biometric setup failed:", error);
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
    console.log("🔐 Authenticating and retrieving credentials");

    // Check if biometric is enabled first
    const isEnabled = await this.isEnabled();
    if (!isEnabled) {
      return {
        success: false,
        error: "Biometric authentication is not enabled for this user",
        errorCode: BiometricErrorCode.BIOMETRY_NOT_AVAILABLE,
      };
    }

    // Check if credentials exist
    const storedCredentials = await secureStorage.getBiometricCredentials();
    if (!storedCredentials) {
      return {
        success: false,
        error: "No biometric credentials found in storage",
        errorCode: BiometricErrorCode.AUTHENTICATION_FAILED,
      };
    }

    // Authenticate with biometric
    const authResult = await this.authenticate(options);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
        errorCode: authResult.errorCode,
      };
    }

    // Return the stored credentials
    console.log("✅ Successfully retrieved biometric credentials");
    return {
      success: true,
      credentials: storedCredentials,
    };
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    console.log("🔧 Disabling biometric authentication");

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
      console.log("✅ Biometric authentication disabled");
    } catch (error) {
      console.error("❌ Failed to disable biometric authentication:", error);
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
      console.error("❌ Failed to check biometric enabled status:", error);
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
      console.error("❌ Failed to get biometric settings:", error);
      return {
        enabled: false,
        failureCount: 0,
        maxFailures: 5,
      };
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

      // Check if user has had too many failures
      const settings = await this.getSettings();
      if (
        settings.failureCount &&
        settings.failureCount >= (settings.maxFailures || 5)
      ) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to check if should offer biometric:", error);
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

    return BiometricErrorCode.BIOMETRY_UNKNOWN_ERROR;
  }

  private async updateLastUsed(): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.lastUsedAt = new Date().toISOString();
      settings.failureCount = 0; // Reset failure count on successful auth
      await secureStorage.storeBiometricSettings(settings);
    } catch (error) {
      console.warn("⚠️ Failed to update last used timestamp:", error);
    }
  }

  private async incrementFailureCount(): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.failureCount = (settings.failureCount || 0) + 1;
      await secureStorage.storeBiometricSettings(settings);
    } catch (error) {
      console.warn("⚠️ Failed to increment failure count:", error);
    }
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
