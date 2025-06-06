import crypto from "crypto";
import { logger } from "./logger.js";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || "";

    if (!this.encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is required");
    }

    if (this.encryptionKey.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be exactly 32 characters long");
    }
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypts a string using AES-256-CBC
   * @param text - The text to encrypt
   * @returns Encrypted string in base64 format
   */
  public encrypt(text: string): string {
    try {
      if (!text || typeof text !== "string") {
        throw new Error("Text to encrypt must be a non-empty string");
      }

      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive key from password and salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        100000,
        32,
        "sha256",
      );

      // Create cipher with explicit IV
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Combine salt + iv + encrypted data
      const combined = Buffer.concat([salt, iv, Buffer.from(encrypted, "hex")]);

      return combined.toString("base64");
    } catch (error) {
      logger.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypts a string using AES-256-CBC
   * @param encryptedData - The encrypted data in base64 format
   * @returns Decrypted string
   */
  public decrypt(encryptedData: string): string {
    try {
      if (!encryptedData || typeof encryptedData !== "string") {
        throw new Error("Encrypted data must be a non-empty string");
      }

      // Convert from base64
      const combined = Buffer.from(encryptedData, "base64");

      if (combined.length < SALT_LENGTH + IV_LENGTH) {
        throw new Error("Invalid encrypted data format");
      }

      // Extract components
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH);

      // Derive key from password and salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        100000,
        32,
        "sha256",
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

      // Decrypt the data
      let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      logger.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Encrypts sensitive fields in an object
   * @param data - Object containing data to encrypt
   * @param fieldsToEncrypt - Array of field names to encrypt
   * @returns Object with encrypted fields
   */
  public encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[],
  ): T {
    const result = { ...data };

    for (const field of fieldsToEncrypt) {
      if (result[field] && typeof result[field] === "string") {
        result[field] = this.encrypt(result[field] as string) as T[keyof T];
      }
    }

    return result;
  }

  /**
   * Decrypts sensitive fields in an object
   * @param data - Object containing encrypted data
   * @param fieldsToDecrypt - Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  public decryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToDecrypt: (keyof T)[],
  ): T {
    const result = { ...data };

    for (const field of fieldsToDecrypt) {
      if (result[field] && typeof result[field] === "string") {
        try {
          result[field] = this.decrypt(result[field] as string) as T[keyof T];
        } catch (error) {
          logger.error(`Failed to decrypt field ${String(field)}:`, error);
          // Keep the encrypted value if decryption fails
        }
      }
    }

    return result;
  }

  /**
   * Validates if a Tax ID (SSN or EIN) is in correct format
   * @param taxId - The tax ID to validate
   * @returns boolean indicating if the format is valid
   */
  public validateTaxIdFormat(taxId: string): boolean {
    if (!taxId || typeof taxId !== "string") {
      return false;
    }

    // Remove any non-digit characters for validation
    const cleanTaxId = taxId.replace(/\D/g, "");

    // SSN format: 9 digits
    const ssnPattern = /^\d{9}$/;

    // EIN format: 9 digits
    const einPattern = /^\d{9}$/;

    return ssnPattern.test(cleanTaxId) || einPattern.test(cleanTaxId);
  }

  /**
   * Formats a Tax ID for display (masks sensitive digits)
   * @param taxId - The tax ID to format
   * @returns Masked tax ID string
   */
  public formatTaxIdForDisplay(taxId: string): string {
    if (!taxId || typeof taxId !== "string") {
      return "";
    }

    const cleanTaxId = taxId.replace(/\D/g, "");

    if (cleanTaxId.length === 9) {
      // Format as XXX-XX-XXXX (SSN) or XX-XXXXXXX (EIN)
      // Show only last 4 digits
      return `***-**-${cleanTaxId.slice(-4)}`;
    }

    return "***-**-****";
  }

  /**
   * Generates a secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns Random token as hex string
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Creates a hash of sensitive data for comparison purposes
   * @param data - The data to hash
   * @returns SHA-256 hash as hex string
   */
  public createHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

// Export singleton instance (lazy initialization)
let _encryptionService: EncryptionService | null = null;
export const encryptionService = {
  get instance() {
    if (!_encryptionService) {
      _encryptionService = EncryptionService.getInstance();
    }
    return _encryptionService;
  },
};

// Export utility functions for common use cases
export const encryptTaxId = (taxId: string): string => {
  return encryptionService.instance.encrypt(taxId);
};

export const decryptTaxId = (encryptedTaxId: string): string => {
  return encryptionService.instance.decrypt(encryptedTaxId);
};

export const validateTaxId = (taxId: string): boolean => {
  return encryptionService.instance.validateTaxIdFormat(taxId);
};

export const formatTaxIdDisplay = (taxId: string): string => {
  return encryptionService.instance.formatTaxIdForDisplay(taxId);
};

export const encryptQuickBooksTokens = (tokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  return {
    accessToken: encryptionService.instance.encrypt(tokens.accessToken),
    refreshToken: encryptionService.instance.encrypt(tokens.refreshToken),
  };
};

export const decryptQuickBooksTokens = (encryptedTokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  return {
    accessToken: encryptionService.instance.decrypt(
      encryptedTokens.accessToken,
    ),
    refreshToken: encryptionService.instance.decrypt(
      encryptedTokens.refreshToken,
    ),
  };
};

/**
 * Generates a secure 32-character encryption key
 * @returns A random 32-character hex string
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(16).toString("hex");
};
