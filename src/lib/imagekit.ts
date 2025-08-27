import ImageKit from "imagekit";

// Initialize ImageKit with environment variables
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

export interface UploadedImage {
  fileId: string;
  url: string;
  fileName: string;
  filePath: string;
}

export class ImageKitService {
  /**
   * Upload a single file to ImageKit
   */
  static async uploadFile(
    file: Buffer | string,
    fileName: string,
    folder: string = "products"
  ): Promise<UploadedImage> {
    try {
      const result = await imagekit.upload({
        file: file,
        fileName: fileName,
        folder: folder,
        useUniqueFileName: true,
      });

      return {
        fileId: (result as any).fileId || "",
        url: (result as any).url || "",
        fileName: (result as any).name || fileName,
        filePath: (result as any).filePath || "",
      };
    } catch (error) {
      console.error("ImageKit upload error:", error);
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Upload multiple files to ImageKit
   */
  static async uploadMultipleFiles(
    files: Array<{ file: Buffer | string; fileName: string }>,
    folder: string = "products"
  ): Promise<UploadedImage[]> {
    try {
      const uploadPromises = files.map(({ file, fileName }) =>
        this.uploadFile(file, fileName, folder)
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Multiple upload error:", error);
      throw new Error(
        `Failed to upload images: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a file from ImageKit
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      await imagekit.deleteFile(fileId);
    } catch (error) {
      console.error("ImageKit delete error:", error);
      throw new Error(
        `Failed to delete image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete multiple files from ImageKit
   */
  static async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    try {
      const deletePromises = fileIds.map((fileId) => this.deleteFile(fileId));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Multiple delete error:", error);
      throw new Error(
        `Failed to delete images: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get file details from ImageKit
   */
  static async getFileDetails(fileId: string) {
    try {
      return await imagekit.getFileDetails(fileId);
    } catch (error) {
      console.error("ImageKit get file details error:", error);
      throw new Error(
        `Failed to get file details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Convert base64 data URL to buffer for upload
   */
  static base64ToBuffer(base64DataUrl: string): Buffer {
    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = base64DataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }

  /**
   * Extract file extension from data URL
   */
  static getFileExtensionFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/^data:image\/([a-z]+);base64,/);
    return match ? match[1] : "jpg";
  }
}

export default ImageKitService;
