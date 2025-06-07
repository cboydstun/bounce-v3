export declare class EncryptionService {
  private static instance;
  private encryptionKey;
  private constructor();
  static getInstance(): EncryptionService;
  /**
   * Encrypts a string using AES-256-CBC
   * @param text - The text to encrypt
   * @returns Encrypted string in base64 format
   */
  encrypt(text: string): string;
  /**
   * Decrypts a string using AES-256-CBC
   * @param encryptedData - The encrypted data in base64 format
   * @returns Decrypted string
   */
  decrypt(encryptedData: string): string;
  /**
   * Encrypts sensitive fields in an object
   * @param data - Object containing data to encrypt
   * @param fieldsToEncrypt - Array of field names to encrypt
   * @returns Object with encrypted fields
   */
  encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[],
  ): T;
  /**
   * Decrypts sensitive fields in an object
   * @param data - Object containing encrypted data
   * @param fieldsToDecrypt - Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToDecrypt: (keyof T)[],
  ): T;
  /**
   * Validates if a Tax ID (SSN or EIN) is in correct format
   * @param taxId - The tax ID to validate
   * @returns boolean indicating if the format is valid
   */
  validateTaxIdFormat(taxId: string): boolean;
  /**
   * Formats a Tax ID for display (masks sensitive digits)
   * @param taxId - The tax ID to format
   * @returns Masked tax ID string
   */
  formatTaxIdForDisplay(taxId: string): string;
  /**
   * Generates a secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns Random token as hex string
   */
  generateSecureToken(length?: number): string;
  /**
   * Creates a hash of sensitive data for comparison purposes
   * @param data - The data to hash
   * @returns SHA-256 hash as hex string
   */
  createHash(data: string): string;
}
export declare const encryptionService: {
  readonly instance: EncryptionService;
};
export declare const encryptTaxId: (taxId: string) => string;
export declare const decryptTaxId: (encryptedTaxId: string) => string;
export declare const validateTaxId: (taxId: string) => boolean;
export declare const formatTaxIdDisplay: (taxId: string) => string;
export declare const encryptQuickBooksTokens: (tokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  accessToken: string;
  refreshToken: string;
};
export declare const decryptQuickBooksTokens: (encryptedTokens: {
  accessToken: string;
  refreshToken: string;
}) => {
  accessToken: string;
  refreshToken: string;
};
/**
 * Generates a secure 32-character encryption key
 * @returns A random 32-character hex string
 */
export declare const generateEncryptionKey: () => string;
//# sourceMappingURL=encryption.d.ts.map
