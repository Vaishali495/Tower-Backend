const router = require("express").Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error.middleware");
const { validate } = require("../middleware/validate");
const { deleteNotificationSchema } = require("../validations/notification.validation");

/**
 * =============================================================================
 * Notification Routes
 * =============================================================================
 */

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: endpoints for managing notifications
 */

router.get("/", auth, asyncHandler(notificationController.getAllNotification));

router.delete(
  "/",
  auth,
  validate(deleteNotificationSchema),
  asyncHandler(notificationController.deleteNotification),
);

router.patch("/read-all",auth,asyncHandler(notificationController.readAllNotification))

// router.patch("/read/:notificationId",auth,asyncHandler(notificationController.readNotificationById))

module.exports = router;
