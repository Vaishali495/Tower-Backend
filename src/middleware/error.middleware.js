const multer = require("multer");
const { deleteFiles } = require("../services/upload.service");
const { badResponse } = require("../utils/response");

const errorHandler = async (err, req, res, next) => {
  // Delete uploaded file if exists
  try {
    if (req.uploadedFiles?.length) {
      await deleteFiles(req.uploadedFiles.savedFiles, req.uploadedFiles.type);
    }
  } catch (cleanupError) {
    console.error("File cleanup failed:", cleanupError);
  }

  console.log("====================================");
  console.log("err.name", err.name);
  console.log("err.message", err.message);
  console.log("====================================");

  // Duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "Field";
    return badResponse(res, `${field} already exists`, "Duplicate field", 400);
  }

  // Validation error
  if (err.name === "ValidationError") {
    const messages = err.errors
      ? Object.values(err.errors).map((e) => e.message)
      : [err.message];
    return badResponse(res, messages.join(", "), "Validation Error", 400);
  }

  // Cast error
  if (err.name === "CastError") {
    return badResponse(res, `Invalid ${err.path}`, "Invalid Data", 400);
  }

  //Multer error
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File too large (max 2MB allowed)",
      LIMIT_FILE_COUNT: "Too many files (max 5 allowed)",
      LIMIT_FIELD_VALUE: "Field value too large",
    };

    return res.status(400).json({
      success: false,
      message: "File upload error",
      errors: [{
        field: "files",
        message: messages[err.code] || err.message,
      }],
    });
  }

  // Default
  return badResponse(
    res,
    err.message || "Something went wrong",
    "Server Error",
    500,
  );
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, asyncHandler };
