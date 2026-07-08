const Notification = require("../models/notification.model");
const { NOTIFICATION_STATUS } = require("../constants/enums");

const populateOptions = [
  { path: "notificationFor", select: "name email image" },
  { path: "createdBy", select: "name email image" },
  { path: "referenceId" },
];

exports.findNotifications = (userId, skip, limit) =>
  Notification.find({ notificationFor: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate(populateOptions)
    .lean();

exports.findNotificationById = (notificationId, userId) =>
  Notification.findOne({ _id: notificationId, notificationFor: userId }).lean();

exports.countNotifications = (userId) =>
  Notification.countDocuments({ notificationFor: userId });

exports.countUnread = (userId) =>
  Notification.countDocuments({
    notificationFor: userId,
    status: { $ne: NOTIFICATION_STATUS.READ },
  });

exports.deleteAllByUser = (userId) =>
  Notification.deleteMany({ notificationFor: userId });

exports.findByIdsAndUser = (ids, userId) =>
  Notification.find({ _id: { $in: ids }, notificationFor: userId }, { _id: 1 });

exports.deleteManyByIds = (ids, userId) =>
  Notification.deleteMany({ _id: { $in: ids }, notificationFor: userId });

exports.markAllRead = (userId) =>
  Notification.updateMany(
    { notificationFor: userId, status: { $ne: NOTIFICATION_STATUS.READ } },
    { $set: { status: NOTIFICATION_STATUS.READ } },
  );

// exports.markReadById = (notificationId, userId) =>
//   Notification.findOneAndUpdate(
//     { _id: notificationId, notificationFor: userId },
//     { $set: { status: NOTIFICATION_STATUS.READ } },
//   );

exports.markReadByModelId = (modelId, userId) =>
  Notification.updateMany(
    {
      notificationFor: userId,
      referenceId: modelId,
      status: NOTIFICATION_STATUS.UNREAD,
    },
    { $set: { status: NOTIFICATION_STATUS.READ } },
  );

exports.markReadByModelName = async (modelName, userId) => {
  return Notification.updateMany(
    {
      notificationFor: userId,
      referenceModel: modelName,
      status: NOTIFICATION_STATUS.UNREAD,
    },
    { $set: { status: NOTIFICATION_STATUS.READ } },
  );
};
