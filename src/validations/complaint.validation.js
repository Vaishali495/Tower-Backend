const Joi = require("joi");
const mongoose = require("mongoose");
const { STATUS, SEVERITY, DEPARTMENTS } = require("../constants/enums");

const complaintIdParamSchema = Joi.object({
  complaintId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid complaintId");
      }
      return value;
    }),
});

const mongooseIdSchema = Joi.string()
  .required()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message("Invalid userId");
    }
    return value;
  });

// Create Complaint Validation Schema
const createComplaintSchema = Joi.object({
  title: Joi.string().trim().min(5).max(100).required().messages({
    "string.empty": "Title cannot be empty",
    "any.required": "Title is required",
    "string.min": "Title must contain at least 5 characters",
    "string.max": "Title cannot exceed 100 characters",
  }),

  description: Joi.string().trim().min(20).max(500).required().messages({
    "string.empty": "Description cannot be empty",
    "any.required": "Description is required",
    "string.max": "Description cannot exceed 500 characters",
    "string.min": "Description must contain at least 20 characters",
  }),

  concernedDepartments: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(DEPARTMENTS))
    .messages({
      "string.empty": "Concerned Departments cannot be empty",
      "any.required": "Concerned Departments is required",
      "any.only":
        "Concerned Department must be: Electrical, Plumbing, Furniture, General",
    }),

  // floor: Joi.string().trim().required().messages({
  //   "string.empty": "Floor cannot be empty",
  //   "any.required": "Floor is required",
  // }),

  building: Joi.string().trim().messages({
    "string.empty": "Building cannot be empty",
    "any.required": "Building is required",
  }),

  // companyName: Joi.string().trim().required().messages({
  //   "string.empty": "Company name cannot be empty",
  //   "any.required": "Company name is required",
  // }),

  daysFacingIssue: Joi.number().min(0).required().messages({
    "number.base": "Days facing issue must be a number",
    "number.min": "Days cannot be negative",
    "any.required": "Days facing issue is required",
  }),

  image: Joi.any().optional().invalid("", null, "string").messages({
    "any.invalid": "Image must be a valid file (do not send empty value)",
  }),
});

const addCommentSchema = Joi.object({
  userComment: Joi.string().trim().max(200).required().messages({
    "string.empty": "Comment cannot be empty",
    "any.required": "Comment is required",
    // "string.min": "Comment must be at least 10 characters long",
    "string.max": "Comment cannot exceed 200 characters",
  }),
});

// Update Complaint Schema (Admin)
const adminUpdateComplaintSchema = Joi.object({
  complaintStatus: Joi.string()
    .valid(...Object.values(STATUS))
    .trim()
    .messages({
      "any.only":
        "Status must be one of: Pending, In Progress, Resolved",
    }),

  adminComment: Joi.string().trim().max(200).messages({
    "string.empty": "Admin comment cannot be empty",
    // "string.min": "Comment must be at least 10 characters long",
    "string.max": "Comment cannot exceed 200 characters",
  }),

  severity: Joi.string()
    .valid(...Object.values(SEVERITY))
    .messages({
      "any.only": "Severity must be Low, Medium, or High",
    }),
})
  .min(1) // at least one field must be present
  .messages({
    "object.min":
      "At least one field (status, adminComment, severity) is required",
  });

const userUpdateComplaintSchema = createComplaintSchema
  .fork(
    [
      "title",
      "building",
      "description",
      "concernedDepartments",
      "daysFacingIssue",
      "image",
    ],
    (field) => field.optional(),
  )
  .append({
    // userComment: addCommentSchema.extract("userComment").optional(),
    // reopen: Joi.boolean().optional().messages({
    //   "boolean.base": "Reopen must be true or false",
    // }),
  });

const complaintMessageSchema = Joi.object({
  message: Joi.string().trim().max(200).messages({
    "string.empty": "Message comment cannot be empty",
    // "string.min": "Comment must be at least 10 characters long",
    "string.max": "Message cannot exceed 200 characters",
  }),
});

const assignTechnicianSchema = Joi.object({
  complaintId: mongooseIdSchema,
  technicianId: mongooseIdSchema,
});

const technicianStatusSchema = Joi.object({
  complaintId: mongooseIdSchema,
  complaintStatus: Joi.string()
    .valid(...Object.values(STATUS))
    .trim()
    .required()
    .messages({
      "any.only":
        "Status must be one of: Pending, In Progress, Resolved",
    }),
});

const complaintStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(STATUS))
    .trim()
    .messages({
      "any.only":
        "Status must be one of: Pending, In Progress, Resolved",
    }),
});

module.exports = {
  createComplaintSchema,
  adminUpdateComplaintSchema,
  userUpdateComplaintSchema,
  complaintIdParamSchema,
  addCommentSchema,
  complaintMessageSchema,
  assignTechnicianSchema,
  technicianStatusSchema,
  complaintStatusSchema,
};
