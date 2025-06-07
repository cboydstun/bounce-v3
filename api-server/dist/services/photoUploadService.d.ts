export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}
export interface PhotoUploadOptions {
  folder?: string;
  transformation?: any;
  tags?: string[];
}
export declare class PhotoUploadService {
  private static isConfigured;
  /**
   * Initialize Cloudinary configuration
   */
  static initialize(): void;
  /**
   * Check if Cloudinary is properly configured
   */
  static isReady(): boolean;
  /**
   * Upload a photo to Cloudinary
   * @param photoData Base64 encoded photo data or URL
   * @param options Upload options
   */
  static uploadPhoto(
    photoData: string,
    options?: PhotoUploadOptions,
  ): Promise<PhotoUploadResult>;
  /**
   * Upload multiple photos
   * @param photosData Array of photo data
   * @param options Upload options
   */
  static uploadMultiplePhotos(
    photosData: string[],
    options?: PhotoUploadOptions,
  ): Promise<PhotoUploadResult[]>;
  /**
   * Delete a photo from Cloudinary
   * @param publicId The public ID of the photo to delete
   */
  static deletePhoto(publicId: string): Promise<boolean>;
  /**
   * Generate a signed upload URL for direct client uploads
   * @param options Upload options
   */
  static generateSignedUploadUrl(options?: PhotoUploadOptions): string | null;
  /**
   * Validate photo data format
   * @param photoData Photo data to validate
   */
  static validatePhotoData(photoData: string): boolean;
  /**
   * Get optimized image URL with transformations
   * @param publicId The public ID of the image
   * @param transformations Cloudinary transformations
   */
  static getOptimizedUrl(
    publicId: string,
    transformations?: any,
  ): string | null;
  /**
   * Extract public ID from Cloudinary URL
   * @param url Cloudinary URL
   */
  static extractPublicId(url: string): string | null;
}
export default PhotoUploadService;
//# sourceMappingURL=photoUploadService.d.ts.map
