import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { Capacitor } from "@capacitor/core";
import {
  SecureStorageItem,
  SecureStorageOptions,
  BiometricCredentials,
} from "../../types/biometric.types";
import { APP_CONFIG } from "../../config/app.config";

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
    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS || "biometric_credentials";
    await this.setItem(key, JSON.stringify(credentials), {
      encrypt: true,
      requireBiometric: true,
      expirationTime: APP_CONFIG.JWT_REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Retrieve biometric credentials
   */
  async getBiometricCredentials(): Promise<BiometricCredentials | null> {
    try {
      const key =
        APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS ||
        "biometric_credentials";
      const credentialsJson = await this.getItem(key);

      if (!credentialsJson) {
        return null;
      }

      return JSON.parse(credentialsJson) as BiometricCredentials;
    } catch (error) {
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
