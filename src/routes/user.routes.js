const router = require("express").Router();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  userIdParamSchema,
  addUserSchema,
  updateProfileSchema,
  updatePasswordSchema,
  addAdminSchema,
} = require("../validations/auth.validation");
const { asyncHandler } = require("../middleware/error.middleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const multer = require("multer");
const { validateFiles, uploadMiddleware } = require("../middleware/fileFilter");
const userController = require("../controllers/userController");

/**
 * =============================================================================
 * User Routes
 * =============================================================================
 */

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management end points
 */

router.post(
  "/add-admin",
  uploadMiddleware.any(),
  validate(addAdminSchema),
  validateFiles({ required: true }),
  asyncHandler(userController.addAdmin),
);

router.get(
  "/getuser/:userId",
  auth,
  validate(userIdParamSchema, "params"),
  asyncHandler(userController.getUserById),
);

router.post(
  "/adduser",
  auth,
  isAdmin,
  uploadMiddleware.any(),
  // multer().any(),
  validate(addUserSchema),
  validateFiles({ required: true }),
  asyncHandler(userController.addUser),
);

router.put(
  "/update-password",
  auth,
  isAdmin,
  validate(updatePasswordSchema),
  asyncHandler(userController.updatePassword),
);

router.put(
  "/update-profile",
  auth,
  isAdmin,
  // multer().any(),
  uploadMiddleware.any(),
  validate(updateProfileSchema),
  validateFiles({ required: false }),
  asyncHandler(userController.updateProfile),
);

router.get(
  "/userslist",
  auth,
  isAdmin,
  asyncHandler(userController.getUsersList),
);

router.delete(
  "/users/:userId",
  auth,
  isAdmin,
  validate(userIdParamSchema, "params"),
  asyncHandler(userController.deleteUser),
);

// router.post("/testerror",asyncHandler(userController.testError));

module.exports = router;
