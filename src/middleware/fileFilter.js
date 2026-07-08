const multer = require("multer");

const uploadMiddleware = multer({
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10 MB for text fields
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5, // max 5 files
  },
});

const validateFiles = ({ required = false } = {}) => {
  return (req, res, next) => {
    const errors = [];

    if ((!req.files || req.files.length === 0) && required) {
      errors.push({
        field: "files",
        message: "Profile image is required",
      });

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // No files + not required
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    // const maxFileSize = 2 * 1024 * 1024;
    // const maxFiles = 5;

    // if (req.files.length > maxFiles) {
    //   errors.push({
    //     field: "files",
    //     message: `Maximum ${maxFiles} files allowed`,
    //   });
    // }

    req.files.forEach((file, index) => {
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push({
          field: `files.${index}`,
          message: `Invalid file type: ${file.originalname}`,
        });
      }

      // if (file.size > maxFileSize) {
      //   errors.push({
      //     field: `files.${index}`,
      //     message: `File too large: ${file.originalname} (Max 2MB allowed)`,
      //   });
      // }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    next();
  };
};

module.exports = { uploadMiddleware, validateFiles };
