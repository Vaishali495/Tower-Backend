const Joi = require("joi");

const deleteNotificationSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .when("deleteAll", {
      is: true,
      then: Joi.forbidden(),
      otherwise: Joi.required(),
    })
    .messages({
      "array.base": "notificationIds must be an array",
      "any.required": "notificationIds is required when deleteAll is false",
      "string.hex": "Each notificationId must be a valid ObjectId",
      "string.length": "Each notificationId must be 24 characters long",
    }),

  deleteAll: Joi.boolean().default(false).messages({
    "boolean.base": "deleteAll must be true or false",
  }),
});

module.exports = { deleteNotificationSchema };