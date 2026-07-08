const Joi = require("joi");
const mongoose = require("mongoose");
const { ROLE, TECHNICIAN_DESIGNATION } = require("../constants/enums");

const userIdParamSchema = Joi.object({
  userId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid userId");
      }
      return value;
    }),
});

const userIdSchema = Joi.string()
  .required()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message("Invalid userId");
    }
    return value;
  });

const emailField = Joi.string().email().required().messages({
  "string.empty": "Email cannot be empty",
  "any.required": "Email is required",
  "string.email": "Please provide a valid email",
});

const passwordField = Joi.string()
  .min(6)
  .pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "string.pattern.base":
      "Password must include at least one uppercase letter, one number, and one special character (!@#$%^&*)",
  });

const fcmToken = Joi.string().required().messages({
  "string.empty": "FCM cannot be empty",
  "any.required": "FCM token is required",
});

const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    // "string.min": "Password must be at least 6 characters long",
  }),
  fcmToken: fcmToken,
});

const logoutSchema = Joi.object({
  fcmToken: fcmToken,
});

const addUserSchema = Joi.object({
  email: emailField,
  password: passwordField,
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[A-Za-z\s]+$/)
    .messages({
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
      "string.pattern.base": "Name can only contain alphabets and spaces",
    }),

  role: Joi.string()
    .required()
    .valid(...Object.values(ROLE))
    .messages({
      "string.empty": "role cannot be empty",
      "any.required": "role is required",
      "any.only": `Role must be one of User and Technician`,
      // "any.only": `Role must be one of: ${Object.values(ROLE).join(", ")}`,
    }),

  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number cannot be empty",
      "any.required": "Mobile number is required",
      "string.pattern.base": "Mobile number must be 10 digits",
    }),

  // Tenant fields
  floor: Joi.when("role", {
    is: ROLE.TENANT,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }).messages({
    "any.required": "Floor is required",
    "any.unknown": "Floor is allowed only for tenant",
  }),

  companyName: Joi.when("role", {
    is: ROLE.TENANT,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }).messages({
    "any.required": "Company name is required",
    "any.unknown": "Company name is allowed only for tenant",
  }),

  building: Joi.when("role", {
    is: ROLE.TENANT,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }).messages({
    "any.required": "Building is required",
    "any.unknown": "Building is allowed only for tenant",
  }),

  // Technician fields
  designation: Joi.when("role", {
    is: ROLE.TECHNICIAN,
    then: Joi.string()
      .valid(...Object.values(TECHNICIAN_DESIGNATION))
      .required(),
    otherwise: Joi.forbidden(),
  }).messages({
    "any.required": "Designation is required",
    "any.only": `Designation must be one of: ${Object.values(
      TECHNICIAN_DESIGNATION,
    ).join(", ")}`,
    "any.unknown": "Designation is allowed only for technician",
  }),

  experience: Joi.when("role", {
    is: ROLE.TECHNICIAN,
    then: Joi.number().min(0).optional(),
    otherwise: Joi.forbidden(),
  }).messages({
    "number.base": "Experience must be a number",
    "number.min": "Experience cannot be negative",
    "any.unknown": "Experience is allowed only for technician",
  }),

  image: Joi.any().optional().invalid("", null, "string").messages({
    "any.invalid": "image must be a valid file (do not send empty value)",
  }),
});

const updatePasswordSchema = Joi.object({
  userId: userIdSchema,
  password: passwordField,
  confirmPassword: Joi.string().valid(Joi.ref("password")).messages({
    "any.only": "Passwords do not match",
  }),
});

const updateProfileSchema = addUserSchema
  .fork(
    [
      // "email",
      "name",
      // "role",
      "mobileNumber",
      "image",
      "password",
    ],
    (field) => field.optional(),
  )
  .append({
    userId: userIdSchema,
    floor: Joi.string().optional(),
    companyName: Joi.string().optional(),
    building: Joi.string().optional(),
    designation: Joi.string()
      .valid(...Object.values(TECHNICIAN_DESIGNATION))
      .optional(),
    experience: Joi.number().min(0).optional(),
    email: Joi.forbidden(),
    role: Joi.forbidden(),
    confirmPassword: Joi.forbidden(),
  })
  .min(1)
  .messages({
    "object.min": "At least one field is required to update",
  });

const addAdminSchema = Joi.object({
  email: emailField,
  password: passwordField,
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required",
  }),
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[A-Za-z\s]+$/)
    .messages({
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
      "string.pattern.base": "Name can only contain alphabets and spaces",
    }),
  image: Joi.any().optional().invalid("", null, "string").messages({
    "any.invalid": "image must be a valid file (do not send empty value)",
  }),
  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number cannot be empty",
      "any.required": "Mobile number is required",
      "string.pattern.base": "Mobile number must be 10 digits",
    }),
});

module.exports = {
  loginSchema,
  logoutSchema,
  userIdParamSchema,
  addUserSchema,
  updatePasswordSchema,
  updateProfileSchema,
  addAdminSchema,
};
