const Joi = require("joi");
const mongoose = require("mongoose");

const postIdParamSchema = Joi.object({
  postId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid userId");
      }
      return value;
    }),
});

const addPostSchema = Joi.object({
  title: Joi.string().required().max(150).messages({
    "title.empty": "Title cannot be empty",
    "any.required": "Title is required",
    "string.max": "Title cannot exceed 150 characters",
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  image: Joi.any().optional().invalid("", null, "string").messages({
    "any.invalid": "Image must be a valid file (do not send empty value)",
  }),
});

const updatePostSchema = addPostSchema
  .fork(["title", "description", "image"], (field) => field.optional())
  //.min(1) // at least one field must be present
  // .messages({
  //   "object.min":
  //     "At least one field (title, description, image) is required",
  // });

module.exports = {
  postIdParamSchema,
  addPostSchema,
  updatePostSchema,
};
