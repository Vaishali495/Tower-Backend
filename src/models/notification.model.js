const mongoose = require("mongoose");
const {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  REFERENCE_MODEL,
} = require("../constants/enums");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    notificationFor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.UNREAD,
    },
    notificationType: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: "",
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      refPath: "referenceModel",
      default: null,
    },
    referenceModel: {
      type: String,
      enum: Object.values(REFERENCE_MODEL),
      default: null,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema,
  "notifications",
);
