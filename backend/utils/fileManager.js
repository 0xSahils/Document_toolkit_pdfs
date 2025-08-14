const fs = require("fs-extra");
const path = require("path");
const cloudinary = require("../config/cloudinary");

class FileManager {
  static async cleanupFiles(filePaths, delay = 1800000) {
    // 30 minutes instead of 5
    setTimeout(async () => {
      for (const filePath of filePaths) {
        try {
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
          }
        } catch (error) {
          console.error(`Failed to cleanup file ${filePath}:`, error.message);
        }
      }
    }, delay);
  }

  static async uploadToCloudinary(filePath, folder = "pdf-toolkit") {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: "raw",
        use_filename: true,
        unique_filename: true,
        access_mode: "public",
        type: "upload",
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
      };
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  static async deleteFromCloudinary(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error.message);
    }
  }

  static getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static generateUniqueFilename(originalName, suffix = "") {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    return `${name}${suffix}_${timestamp}_${random}${ext}`;
  }

  static async createTempDir(baseName = "temp") {
    const tempDir = path.join(
      __dirname,
      "../uploads",
      `${baseName}_${Date.now()}`
    );
    await fs.ensureDir(tempDir);
    return tempDir;
  }
}

module.exports = FileManager;
