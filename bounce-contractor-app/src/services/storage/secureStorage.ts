import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { Capacitor } from "@capacitor/core";
import {
  SecureStorageItem,
  SecureStorageOptions,
  BiometricCredentials,
} from "../../types/biometric.types";
import { APP_CONFIG } from "../../config/app.config";
import { biometricDebugLogger } from "../../utils/biometricDebugLogger";

class SecureStorageService {
  private isNative: boolean;
  private fallbackStorage: Map<string, string>;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.fallbackStorage = new Map();
  }

  /**
   * Store a value securely
   */
  async setItem(
    key: string,
    value: string,
    options: SecureStorageOptions = {},
  ): Promise<void> {
    try {
      const item: SecureStorageItem = {
        key,
        value,
        createdAt: new Date().toISOString(),
        expiresAt: options.expirationTime
          ? new Date(Date.now() + options.expirationTime).toISOString()
          : undefined,
      };

      const serializedItem = JSON.stringify(item);

      if (this.isNative) {
        await SecureStoragePlugin.set({
          key,
          value: serializedItem,
        });
      } else {
        // Web fallback - use encrypted localStorage
        this.fallbackStorage.set(key, serializedItem);
        localStorage.setItem(`secure_${key}`, serializedItem);
      }
    } catch (error) {
      console.error("SecureStorage setItem error:", error);
      throw new Error(`Failed to store secure item: ${error}`);
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      let serializedItem: string | null = null;

      if (this.isNative) {
        const result = await SecureStoragePlugin.get({ key });
        serializedItem = result.value;
      } else {
        // Web fallback
        serializedItem =
          this.fallbackStorage.get(key) ||
          localStorage.getItem(`secure_${key}`);
      }

      if (!serializedItem) {
        return null;
      }

      const item: SecureStorageItem = JSON.parse(serializedItem);

      // Check if item has expired
      if (item.expiresAt && new Date(item.expiresAt) <= new Date()) {
        await this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error("SecureStorage getItem error:", error);
      return null;
    }
  }

  /**
   * Remove a secure item
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (this.isNative) {
        await SecureStoragePlugin.remove({ key });
      } else {
        // Web fallback
        this.fallbackStorage.delete(key);
        localStorage.removeItem(`secure_${key}`);
      }
    } catch (error) {
      console.error("SecureStorage removeItem error:", error);
      throw new Error(`Failed to remove secure item: ${error}`);
    }
  }

  /**
   * Check if a key exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      if (this.isNative) {
        const result = await SecureStoragePlugin.get({ key });
        return !!result.value;
      } else {
        // Web fallback
        return (
          this.fallbackStorage.has(key) ||
          localStorage.getItem(`secure_${key}`) !== null
        );
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all secure storage
   */
  async clear(): Promise<void> {
    try {
      if (this.isNative) {
        await SecureStoragePlugin.clear();
      } else {
        // Web fallback - clear all secure items
        this.fallbackStorage.clear();
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith("secure_")) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error("SecureStorage clear error:", error);
      throw new Error(`Failed to clear secure storage: ${error}`);
    }
  }

  /**
   * Store biometric credentials securely
   */
  async storeBiometricCredentials(
    credentials: BiometricCredentials,
  ): Promise<void> {
    const operation = "storeBiometricCredentials";

    try {
      biometricDebugLogger.log(operation, "start", true, {
        hasCredentials: !!credentials,
      });

      // Validate credentials before storing
      const validation = biometricDebugLogger.validateCredentials(credentials);
      if (!validation.valid) {
        biometricDebugLogger.log(operation, "validation_failed", false, {
          issues: validation.issues,
        });
        throw new Error(`Invalid credentials: ${validation.issues.join(", ")}`);
      }

      biometricDebugLogger.log(operation, "validation_passed", true);

      const key =
        APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS ||
        "biometric_credentials";
      biometricDebugLogger.log(operation, "using_key", true, { key });

      const credentialsJson = JSON.stringify(credentials);
      biometricDebugLogger.log(operation, "serialized", true, {
        length: credentialsJson.length,
      });

      await this.setItem(key, credentialsJson, {
        encrypt: true,
        requireBiometric: true,
        expirationTime: APP_CONFIG.JWT_REFRESH_TOKEN_EXPIRY,
      });

      biometricDebugLogger.log(operation, "stored", true);

      // Verify storage by immediately reading back
      const verification = await this.getItem(key);
      if (!verification) {
        biometricDebugLogger.log(operation, "verification_failed", false, {
          error: "Could not read back stored credentials",
        });
        throw new Error("Failed to verify credential storage");
      }

      biometricDebugLogger.log(operation, "verified", true, {
        length: verification.length,
      });
    } catch (error) {
      biometricDebugLogger.log(operation, "error", false, undefined, error);
      throw error;
    }
  }

  /**
   * Retrieve biometric credentials
   */
  async getBiometricCredentials(): Promise<BiometricCredentials | null> {
    const operation = "getBiometricCredentials";

    try {
      biometricDebugLogger.log(operation, "start", true);

      const key =
        APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS ||
        "biometric_credentials";
      biometricDebugLogger.log(operation, "using_key", true, { key });

      // Check if key exists first
      const hasKey = await this.hasItem(key);
      biometricDebugLogger.log(operation, "key_exists", hasKey, { hasKey });

      if (!hasKey) {
        biometricDebugLogger.log(operation, "no_key_found", false, {
          message: "No biometric credentials key found in storage",
        });
        return null;
      }

      const credentialsJson = await this.getItem(key);
      biometricDebugLogger.log(operation, "retrieved_raw", !!credentialsJson, {
        hasData: !!credentialsJson,
        length: credentialsJson?.length || 0,
      });

      if (!credentialsJson) {
        biometricDebugLogger.log(operation, "no_data", false, {
          message: "Key exists but no data retrieved",
        });
        return null;
      }

      let credentials: BiometricCredentials;
      try {
        credentials = JSON.parse(credentialsJson) as BiometricCredentials;
        biometricDebugLogger.log(operation, "parsed", true, {
          hasUsername: !!credentials.username,
        });
      } catch (parseError) {
        biometricDebugLogger.log(
          operation,
          "parse_error",
          false,
          undefined,
          parseError,
        );
        throw new Error(`Failed to parse stored credentials: ${parseError}`);
      }

      // Validate the retrieved credentials
      const validation = biometricDebugLogger.validateCredentials(credentials);
      if (!validation.valid) {
        biometricDebugLogger.log(
          operation,
          "invalid_stored_credentials",
          false,
          { issues: validation.issues },
        );
        // Don't throw here, but log the issue and return null
        return null;
      }

      biometricDebugLogger.log(operation, "success", true, {
        hasCredentials: true,
      });
      return credentials;
    } catch (error) {
      biometricDebugLogger.log(operation, "error", false, undefined, error);
      console.error("Failed to retrieve biometric credentials:", error);
      return null;
    }
  }

  /**
   * Remove biometric credentials
   */
  async removeBiometricCredentials(): Promise<void> {
    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS || "biometric_credentials";
    await this.removeItem(key);
  }

  /**
   * Store biometric settings
   */
  async storeBiometricSettings(settings: any): Promise<void> {
    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED || "biometric_settings";
    await this.setItem(key, JSON.stringify(settings));
  }

  /**
   * Get biometric settings
   */
  async getBiometricSettings(): Promise<any> {
    try {
      const key =
        APP_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED || "biometric_settings";
      const settingsJson = await this.getItem(key);

      if (!settingsJson) {
        return { enabled: false };
      }

      return JSON.parse(settingsJson);
    } catch (error) {
      console.error("Failed to retrieve biometric settings:", error);
      return { enabled: false };
    }
  }

  /**
   * Check if secure storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (this.isNative) {
        // Test if we can write and read
        const testKey = "test_availability";
        const testValue = "test";

        await SecureStoragePlugin.set({ key: testKey, value: testValue });
        const result = await SecureStoragePlugin.get({ key: testKey });
        await SecureStoragePlugin.remove({ key: testKey });

        return result.value === testValue;
      } else {
        // Web fallback is always available
        return true;
      }
    } catch (error) {
      console.error("SecureStorage availability check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
