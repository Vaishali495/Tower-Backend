/**
 * =============================================================================
 * NOTIFICATION CONTROLLER - NOTIFICATION MANAGEMENT ENDPOINTS
 * =============================================================================
 *
 * This controller provides HTTP endpoints for notification management,
 * including fetching, deleting, and marking notifications as read.
 *
 * =============================================================================
 */

const notificationService = require("../services/notification.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Get All Notifications
 * @description Fetch paginated notifications for the authenticated user
 * @route GET /api/notification
 * @access Private
 */
exports.getAllNotification = async (req, res) => {
  const data = await notificationService.getAllNotifications(req);
  return successResponse(
    res,
    data.notifications.length
      ? "Notifications fetched successfully"
      : "No notifications found",
    "",
    data,
    200,
  );
};

/**
 * Delete Notification(s)
 * @description Delete one, multiple, or all notifications for the authenticated user.
 *              Pass `deleteAll: true` in the request body to wipe all notifications,
 *              or provide an array of IDs to delete specific ones.
 * @route DELETE /api/notification
 * @access Private
 */
exports.deleteNotification = async (req, res) => {
  const { deleteAll = false } = req.body;
  const { deletedCount, missingIds } =
    await notificationService.deleteNotifications(req);

  return successResponse(
    res,
    missingIds.length
      ? "Some notifications were not found"
      : deleteAll
        ? "All notifications deleted successfully"
        : "Notification(s) deleted successfully",
    "",
    { deletedCount, ...(missingIds.length && { missingIds }) },
    200,
  );
};

/**
 * Mark All Notifications as Read
 * @description Mark every unread notification as read for the authenticated user.
 *              Returns modifiedCount: 0 if all notifications are already read.
 * @route PATCH /api/notification/read-all
 * @access Private
 */
exports.readAllNotification = async (req, res) => {
  const modifiedCount = await notificationService.markAllRead(req);
  return successResponse(
    res,
    modifiedCount === 0
      ? "All notifications are already read"
      : "All unread notifications marked as read",
    "",
    { modifiedCount },
    200,
  );
};

/**
 * Mark Notification as Read by ID
 * @description Mark a single notification as read by its ID.
 *              Returns the updated unread count for the authenticated user.
 * @route PATCH /api/notification/read/:notificationId
 * @access Private
 */
// exports.readNotificationById = async (req, res) => {
//   const data = await notificationService.markRead(req);

//   if (data.notFound)
//     return errorResponse(res, "Notification not found", "error", "", 404);

//   return successResponse(
//     res,
//     data.alreadyRead
//       ? "Notification already read"
//       : "Notification marked as read",
//     "",
//     { unreadCount: data.unreadCount },
//     200,
//   );
// };
