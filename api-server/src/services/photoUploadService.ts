import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger.js";

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

export class PhotoUploadService {
  private static isConfigured = false;

  /**
   * Initialize Cloudinary configuration
   */
  static initialize() {
    if (this.isConfigured) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn(
        "Cloudinary configuration missing. Photo upload will be disabled.",
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
    logger.info("Cloudinary configured successfully");
  }

  /**
   * Check if Cloudinary is properly configured
   */
  static isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload a photo to Cloudinary
   * @param photoData Base64 encoded photo data or URL
   * @param options Upload options
   */
  static async uploadPhoto(
    photoData: string,
    options: PhotoUploadOptions = {},
  ): Promise<PhotoUploadResult> {
    try {
      if (!this.isConfigured) {
        this.initialize();
        if (!this.isConfigured) {
          return {
            success: false,
            error: "Photo upload service not configured",
          };
        }
      }

      const uploadOptions: any = {
        folder: options.folder || "task-completions",
        resource_type: "image",
        format: "jpg",
        quality: "auto:good",
        fetch_format: "auto",
        flags: "progressive",
        transformation: options.transformation || [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
        ],
        tags: options.tags || ["task-completion"],
      };

      const result = await cloudinary.uploader.upload(photoData, uploadOptions);

      logger.info("Photo uploaded successfully", {
        publicId: result.public_id,
        url: result.secure_url,
        bytes: result.bytes,
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error("Error uploading photo to Cloudinary:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown upload error",
      };
    }
  }

  /**
   * Upload multiple photos
   * @param photosData Array of photo data
   * @param options Upload options
   */
  static async uploadMultiplePhotos(
    photosData: string[],
    options: PhotoUploadOptions = {},
  ): Promise<PhotoUploadResult[]> {
    const uploadPromises = photosData.map((photoData, index) =>
      this.uploadPhoto(photoData, {
        ...options,
        tags: [...(options.tags || []), `photo-${index + 1}`],
      }),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a photo from Cloudinary
   * @param publicId The public ID of the photo to delete
   */
  static async deletePhoto(publicId: string): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        logger.warn("Cannot delete photo: Cloudinary not configured");
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === "ok") {
        logger.info("Photo deleted successfully", { publicId });
        return true;
      } else {
        logger.warn("Photo deletion failed", {
          publicId,
          result: result.result,
        });
        return false;
      }
    } catch (error) {
      logger.error("Error deleting photo from Cloudinary:", error);
      return false;
    }
  }

  /**
   * Generate a signed upload URL for direct client uploads
   * @param options Upload options
   */
  static generateSignedUploadUrl(
    options: PhotoUploadOptions = {},
  ): string | null {
    try {
      if (!this.isConfigured) {
        this.initialize();
        if (!this.isConfigured) {
          return null;
        }
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      const uploadOptions = {
        timestamp,
        folder: options.folder || "task-completions",
        transformation:
          options.transformation || "w_1200,h_1200,c_limit,q_auto:good",
        tags: (options.tags || ["task-completion"]).join(","),
      };

      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!apiSecret) {
        throw new Error("CLOUDINARY_API_SECRET not configured");
      }

      const signature = cloudinary.utils.api_sign_request(
        uploadOptions,
        apiSecret,
      );

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;

      if (!cloudName || !apiKey) {
        throw new Error("Cloudinary configuration missing");
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const params = new URLSearchParams({
        ...uploadOptions,
        signature,
        api_key: apiKey,
      } as any);

      return `${uploadUrl}?${params.toString()}`;
    } catch (error) {
      logger.error("Error generating signed upload URL:", error);
      return null;
    }
  }

  /**
   * Validate photo data format
   * @param photoData Photo data to validate
   */
  static validatePhotoData(photoData: string): boolean {
    // Check if it's a valid base64 image
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (base64Regex.test(photoData)) {
      return true;
    }

    // Check if it's a valid HTTP/HTTPS URL
    try {
      const url = new URL(photoData);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param publicId The public ID of the image
   * @param transformations Cloudinary transformations
   */
  static getOptimizedUrl(
    publicId: string,
    transformations?: any,
  ): string | null {
    try {
      if (!this.isConfigured) {
        return null;
      }

      const url = cloudinary.url(publicId, {
        secure: true,
        transformation: transformations || [
          { width: 800, height: 600, crop: "fill" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      });

      if (typeof url === "string") {
        return url;
      }
      return null;
    } catch (error) {
      logger.error("Error generating optimized URL:", error);
      return null;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param url Cloudinary URL
   */
  static extractPublicId(url: string): string | null {
    try {
      const regex = /\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i;
      const match = url.match(regex);
      return match && typeof match[1] === "string" ? match[1] : null;
    } catch (error) {
      logger.error("Error extracting public ID from URL:", error);
      return null;
    }
  }
}

// Initialize on module load
PhotoUploadService.initialize();

export default PhotoUploadService;
