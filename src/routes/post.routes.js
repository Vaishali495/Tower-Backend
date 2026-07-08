const router = require("express").Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const {
  addPostSchema,
  updatePostSchema,
  postIdParamSchema,
} = require("../validations/post.validation");
const { validateFiles, uploadMiddleware } = require("../middleware/fileFilter");
const { asyncHandler } = require("../middleware/error.middleware");
const postContoller = require("../controllers/postController");

/**
 * =============================================================================
 * Post Routes
 * =============================================================================
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Admin-only endpoints for managing posts
 */

router.post(
  "/",
  auth,
  isAdmin,
  uploadMiddleware.any(),
  validate(addPostSchema),
  validateFiles({ required: false }),
  asyncHandler(postContoller.addPost),
);

router.get("/", auth, asyncHandler(postContoller.getAllPosts));

router.get("/:postId",auth,asyncHandler(postContoller.getPostById));

router.put(
  "/:postId",
  auth,
  isAdmin,
  uploadMiddleware.any(),
  validate(updatePostSchema),
  validateFiles({ required: false }),
  asyncHandler(postContoller.editPost),
);

router.delete(
  "/:postId",
  auth,
  isAdmin,
  validate(postIdParamSchema, "params"),
  asyncHandler(postContoller.deletePost),
);

module.exports = router;
