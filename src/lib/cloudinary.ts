import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_CLOUDINARY_API_SECRET,
});

// Helper function to upload image to Cloudinary
export const uploadImage = async (
  file: Buffer,
  folder: string = "blogs",
): Promise<{
  public_id: string;
  url: string;
  filename: string;
}> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: "auto" as const,
      unique_filename: true,
    };

    // Use the upload stream API
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined,
      ) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Upload failed with no error"));
          return;
        }

        resolve({
          public_id: result.public_id,
          url: result.secure_url,
          filename: result.original_filename || `image-${Date.now()}`,
        });
      },
    );

    // Convert buffer to stream and pipe to uploadStream
    const bufferStream = Readable.from(file);
    bufferStream.pipe(uploadStream);
  });
};

// Helper function to delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
