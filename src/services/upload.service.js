const fs = require("fs");
const path = require("path");
const { UPLOAD_TYPES } = require("../constants/enums");

const baseUploadDir = path.join(__dirname, "../uploads");

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = (uploadDir) => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

/**
 * Create (save) files to uploads folder
 */
exports.saveFiles = async (files = [], type) => {
  // if (!files.length) return [];
  if (!files.length) return { savedFiles: [], type };

  const uploadDir = path.join(baseUploadDir, type);
  ensureUploadDir(uploadDir);
  // ensureUploadDir();

  const savedFiles = await Promise.all(
    files.map(async (file) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const fileName = uniqueName + ext;

      const filePath = path.join(uploadDir, fileName);
      await fs.promises.writeFile(filePath, file.buffer);
      return fileName;
    }),
  );
  // for (const file of files) {
  // // const fileName = `${Date.now()}-${file.originalname}`;
  // const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
  // const ext = path.extname(file.originalname);
  // const fileName = uniqueName + ext;
  // const filePath = path.join(uploadDir, fileName);

  //   await fs.promises.writeFile(filePath, file.buffer);

  //   savedFiles.push(fileName);
  // }

  return { savedFiles, type };
};

/**
 * Delete files from uploads folder
 */
exports.deleteFiles = async (fileNames = [], type = "others") => {
  if (!Array.isArray(fileNames)) {
    fileNames = [fileNames];
  }

  if (!fileNames.length) return;
  const uploadDir = path.join(baseUploadDir, type);

  for (const name of fileNames) {
    const filePath = path.join(uploadDir, name);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        // fs.unlinkSync(filePath);
      } else {
        console.log("File not found");
      }
    } catch (err) {
      console.error(`Failed to delete file: ${name}`, err.message);
    }
  }
};

/**
 * Handle image uploads
 */
exports.uploadFiles = async (req, type) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return "";

  const uploadedFiles = await exports.saveFiles(files, type);
  req.uploadedFiles = uploadedFiles;
  return uploadedFiles;
};
