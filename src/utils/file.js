const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local path to file
 * @returns {Promise<object>} - Cloudinary response
 */
const uploadFile = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "companies",
      resource_type: "image", // or "auto" if images vary
    });
    return result;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};

/**
 * Delete a file from local storage
 * @param {string} filePath
 */
const unlinkFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn(`Could not delete file at ${filePath}`, err.message);
  }
};

module.exports = {
  uploadFile,
  unlinkFile,
};
