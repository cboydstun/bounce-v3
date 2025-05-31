import { apiClient } from "./apiClient";
import { ApiResponse } from "../../types/api.types";
import { APP_CONFIG } from "../../config/app.config";

export interface PhotoUploadResponse {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface PhotoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class PhotoService {
  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(
    file: File,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<PhotoUploadResponse> {
    // Validate file
    this.validateFile(file);

    // Compress image if needed
    const processedFile = await this.compressImage(file);

    try {
      const response = await apiClient.uploadFile<PhotoUploadResponse>(
        "/contractors/me/photo",
        processedFile,
        (percentage) => {
          if (onProgress) {
            onProgress({
              loaded: (percentage * processedFile.size) / 100,
              total: processedFile.size,
              percentage,
            });
          }
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Photo upload failed");
      }

      return response.data!;
    } catch (error) {
      console.error("Photo upload error:", error);
      throw error;
    }
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(): Promise<void> {
    try {
      const response = await apiClient.delete("/contractors/me/photo");

      if (!response.success) {
        throw new Error(response.message || "Photo deletion failed");
      }
    } catch (error) {
      console.error("Photo deletion error:", error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
      throw new Error(
        `File size too large. Maximum size is ${APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    // Check file type
    if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      throw new Error(
        `Invalid file type. Allowed types: ${APP_CONFIG.ALLOWED_IMAGE_TYPES.join(", ")}`
      );
    }
  }

  /**
   * Compress image if needed
   */
  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800x800 for profile photos)
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          APP_CONFIG.IMAGE_COMPRESSION_QUALITY
        );
      };

      img.onerror = () => {
        // If image processing fails, return original file
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create image preview URL
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Validate image dimensions
   */
  async validateImageDimensions(
    file: File,
    minWidth = 100,
    minHeight = 100
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;

        if (width < minWidth || height < minHeight) {
          reject(
            new Error(
              `Image too small. Minimum dimensions: ${minWidth}x${minHeight}px`
            )
          );
        } else {
          resolve({ width, height });
        }
      };

      img.onerror = () => {
        reject(new Error("Invalid image file"));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Create singleton instance
export const photoService = new PhotoService();

// Export class for testing
export { PhotoService };
