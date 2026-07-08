const router = require("express").Router();
const auth = require("../middleware/auth");
const { asyncHandler } = require("../middleware/error.middleware");
const { validate } = require("../middleware/validate");
const { loginSchema, logoutSchema } = require("../validations/auth.validation");
const authController = require("../controllers/authController");

/**
 * =============================================================================
 * Auth Routes
 * =============================================================================
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints for both Admin and User roles
 */

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  "/logout",
  auth,
  validate(logoutSchema),
  asyncHandler(authController.logout),
);

module.exports = router;
