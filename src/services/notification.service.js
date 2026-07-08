const { messaging } = require("../firebaseConfig/firebase");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const { generateFileUrl } = require("../utils/helper");
const notificationRepository = require("../repositories/notification.repository");
const { NOTIFICATION_STATUS } = require("../constants/enums");

const formatNotification = (req, notification) => {
  // createdBy image
  if (notification.createdBy?.image) {
    notification.createdBy.image = generateFileUrl(
      req,
      "profile",
      notification.createdBy.image,
    );
  }

  // notificationFor image
  if (notification.notificationFor?.image) {
    notification.notificationFor.image = generateFileUrl(
      req,
      "profile",
      notification.notificationFor.image,
    );
  }

  // referenceId images (e.g. post/complaint with image array)
  if (Array.isArray(notification.referenceId?.image)) {
    notification.referenceId.image = notification.referenceId.image.map((img) =>
      generateFileUrl(req, notification.referenceModel?.toLowerCase(), img),
    );
  }

  return notification;
};

exports.getAllNotifications = async (req) => {
  const { id: userId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    notificationRepository.findNotifications(userId, skip, limit),
    notificationRepository.countNotifications(userId),
    notificationRepository.countUnread(userId),
  ]);

  return {
    notifications: notifications.map((n) => formatNotification(req, n)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

exports.deleteNotifications = async (req) => {
  const { id: userId } = req.user;
  const { notificationIds = [], deleteAll = false } = req.body;

  if (deleteAll) {
    const result = await notificationRepository.deleteAllByUser(userId);
    return { deletedCount: result.deletedCount, missingIds: [] };
  }

  const existing = await notificationRepository.findByIdsAndUser(
    notificationIds,
    userId,
  );
  const existingIds = existing.map((n) => n._id.toString());
  const missingIds = notificationIds.filter((id) => !existingIds.includes(id));

  const result = await notificationRepository.deleteManyByIds(
    existingIds,
    userId,
  );
  return { deletedCount: result.deletedCount, missingIds };
};

exports.markAllRead = async (req) => {
  const { id: userId } = req.user;
  const result = await notificationRepository.markAllRead(userId);
  return result.modifiedCount;
};

// exports.markRead = async (req) => {
//   const { notificationId } = req.params;
//   const { id: userId } = req.user;

//   const existing = await notificationRepository.findNotificationById(
//     notificationId,
//     userId,
//   );
//   if (!existing) return { notFound: true };

//   if (existing.status === NOTIFICATION_STATUS.READ) {
//     const unreadCount = await notificationRepository.countUnread(userId);
//     return { alreadyRead: true, unreadCount };
//   }

//   await notificationRepository.markReadById(notificationId, userId);
//   const unreadCount = await notificationRepository.countUnread(userId);
//   return { alreadyRead: false, unreadCount };
// };

exports.notify = async ({
  title,
  item,
  type,
  model = "",
  target = {},
  imageUrl = [],
  createdBy,
}) => {
  try {
    // console.log("target: ",target);

    //body and data for push notification
    const body = item.description
      ? item.description.length > 80
        ? item.description.substring(0, 80) + "..."
        : item.description
      : `A new ${type.toLowerCase()} update is available`;

    const data = {
      screen: model,
      // _id: item._id.toString(),
      type,
      item: JSON.stringify(item),
    };

    let users = [];
    if (target.userIds) {
      // console.log("target.userIds: ",target.userIds);
      users = await User.find(
        { _id: { $in: target.userIds } },
        { _id: 1, fcmToken: 1 },
      );
    } else if (target.role) {
      users = await User.find({ role: target.role }, { _id: 1, fcmToken: 1 });
    }

    if (!users.length) return;

    //save notification in DB
    const notifications = users.map((user) => ({
      notificationFor: user._id,
      message: title,
      notificationType: type,
      referenceId: item._id,
      referenceModel: model,
      createdBy,
    }));

    await Notification.insertMany(notifications);

    // Collect valid tokens
    const tokens = users
      .flatMap((u) => u.fcmToken || [])
      .filter((t) => typeof t === "string" && t.trim());

    if (!tokens.length) return;
    // console.log("tokens: ",tokens);

    const message = {
      tokens,
      notification: {
        title,
        body,
        image: imageUrl?.[0] || "",
      },
      data,
    };

    //send push notification
    const response = await messaging.sendEachForMulticast(message);
    // console.log("Success Count:", response.successCount);
    // console.log("Failure Count:", response.failureCount);
  } catch (error) {
    console.error("Notification error:", error);
  }
};
