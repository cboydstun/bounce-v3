import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { Capacitor } from "@capacitor/core";
import {
  SecureStorageItem,
  SecureStorageOptions,
  BiometricCredentials,
  BiometricSettings,
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
      console.log(`💾 Storing secure item: ${key}`);

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
        // Web fallback
        this.fallbackStorage.set(key, serializedItem);
        localStorage.setItem(`secure_${key}`, serializedItem);
      }

      console.log(`✅ Successfully stored: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to store secure item ${key}:`, error);
      throw new Error(`Failed to store secure item: ${error}`);
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      console.log(`🔍 Retrieving secure item: ${key}`);
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
        console.log(`⚠️ No data found for key: ${key}`);
        return null;
      }

      const item: SecureStorageItem = JSON.parse(serializedItem);

      // Check if item has expired
      if (item.expiresAt && new Date(item.expiresAt) <= new Date()) {
        console.log(`⏰ Item expired, removing: ${key}`);
        await this.removeItem(key);
        return null;
      }

      console.log(`✅ Successfully retrieved: ${key}`);
      return item.value;
    } catch (error) {
      console.error(`❌ Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a secure item
   */
  async removeItem(key: string): Promise<void> {
    try {
      console.log(`🗑️ Removing secure item: ${key}`);

      if (this.isNative) {
        await SecureStoragePlugin.remove({ key });
      } else {
        // Web fallback
        this.fallbackStorage.delete(key);
        localStorage.removeItem(`secure_${key}`);
      }

      console.log(`✅ Successfully removed: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to remove secure item ${key}:`, error);
      throw new Error(`Failed to remove secure item: ${error}`);
    }
  }

  /**
   * Check if a key exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if key exists: ${key}`);

      if (this.isNative) {
        const result = await SecureStoragePlugin.get({ key });
        const exists = !!result.value;
        console.log(`📱 Native storage check for ${key}: ${exists}`);
        return exists;
      } else {
        // Web fallback
        const inMemory = this.fallbackStorage.has(key);
        const inLocalStorage = localStorage.getItem(`secure_${key}`) !== null;
        const exists = inMemory || inLocalStorage;
        console.log(
          `🌐 Web storage check for ${key}: ${exists} (memory: ${inMemory}, localStorage: ${inLocalStorage})`,
        );
        return exists;
      }
    } catch (error) {
      console.error(`❌ Failed to check if key exists ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all secure storage
   */
  async clear(): Promise<void> {
    try {
      console.log("🧹 Clearing all secure storage");

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

      console.log("✅ Successfully cleared all secure storage");
    } catch (error) {
      console.error("❌ Failed to clear secure storage:", error);
      throw new Error(`Failed to clear secure storage: ${error}`);
    }
  }

  /**
   * Store biometric credentials securely
   */
  async storeBiometricCredentials(
    credentials: BiometricCredentials,
  ): Promise<void> {
    console.log("💾 Storing biometric credentials");

    // Basic validation
    if (!credentials || !credentials.username || !credentials.password) {
      throw new Error(
        "Invalid credentials: username and password are required",
      );
    }

    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS || "biometric_credentials";
    const credentialsJson = JSON.stringify(credentials);

    await this.setItem(key, credentialsJson, {
      encrypt: true,
      requireBiometric: true,
      expirationTime: APP_CONFIG.JWT_REFRESH_TOKEN_EXPIRY,
    });

    // Verify storage by immediately reading back
    const verification = await this.getItem(key);
    if (!verification) {
      throw new Error("Failed to verify credential storage");
    }

    console.log("✅ Biometric credentials stored and verified");
  }

  /**
   * Retrieve biometric credentials
   */
  async getBiometricCredentials(): Promise<BiometricCredentials | null> {
    console.log("🔍 Retrieving biometric credentials");

    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS || "biometric_credentials";

    // Check if key exists first
    const hasKey = await this.hasItem(key);
    if (!hasKey) {
      console.log("⚠️ No biometric credentials key found in storage");
      return null;
    }

    const credentialsJson = await this.getItem(key);
    if (!credentialsJson) {
      console.log("⚠️ Key exists but no data retrieved");
      return null;
    }

    try {
      const credentials = JSON.parse(credentialsJson) as BiometricCredentials;

      // Basic validation
      if (!credentials.username || !credentials.password) {
        console.error(
          "❌ Invalid stored credentials: missing username or password",
        );
        return null;
      }

      console.log("✅ Successfully retrieved biometric credentials");
      return credentials;
    } catch (parseError) {
      console.error("❌ Failed to parse stored credentials:", parseError);
      return null;
    }
  }

  /**
   * Remove biometric credentials
   */
  async removeBiometricCredentials(): Promise<void> {
    console.log("🗑️ Removing biometric credentials");
    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_CREDENTIALS || "biometric_credentials";
    await this.removeItem(key);
  }

  /**
   * Store biometric settings
   */
  async storeBiometricSettings(settings: BiometricSettings): Promise<void> {
    console.log("💾 Storing biometric settings", { enabled: settings.enabled });
    const key =
      APP_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED || "biometric_settings";
    await this.setItem(key, JSON.stringify(settings));
  }

  /**
   * Get biometric settings
   */
  async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      console.log("🔍 Retrieving biometric settings");
      const key =
        APP_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED || "biometric_settings";
      const settingsJson = await this.getItem(key);

      if (!settingsJson) {
        console.log("⚠️ No biometric settings found, returning defaults");
        return { enabled: false, failureCount: 0, maxFailures: 5 };
      }

      const settings = JSON.parse(settingsJson);
      console.log("✅ Retrieved biometric settings", {
        enabled: settings.enabled,
      });
      return settings;
    } catch (error) {
      console.error("❌ Failed to retrieve biometric settings:", error);
      return { enabled: false, failureCount: 0, maxFailures: 5 };
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
      console.error("❌ SecureStorage availability check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
