/**
 * =============================================================================
 * POST CONTROLLER - POST MANAGEMENT ENDPOINTS
 * =============================================================================
 *
 * This controller provides HTTP endpoints for post management,
 * including adding, fetching, updating and deleting.
 *
 * =============================================================================
 */


const postService = require("../services/post.service");
const { errorResponse, successResponse } = require("../utils/response");

/**
 * Create a New Post
 * @description Create a post on behalf of the authenticated user.
 *              At least one of description or an image file is required.
 * @route POST /api/post
 * @access Private
 */
exports.addPost = async (req, res, next) => {
  const { id: userId } = req.user;
  let { description } = req.body;
  const files = Array.isArray(req.files) ? req.files : [];

  if (!description && !files.length) {
    return errorResponse(
      res,
      "At least one of description or image is required.",
      "error",
      "",
      400,
    );
  }

  const post = await postService.createPost(req, userId);
  return successResponse(res, "Post created successfully", "", post, 201);
};

/**
 * Get All Posts
 * @description Fetch a paginated list of all posts.
 * @route GET /api/post
 * @access Private
 */
exports.getAllPosts = async (req, res) => {
  const data = await postService.getAllPosts(req);

  return successResponse(
    res,
    data.posts.length > 0 ? "Posts fetched successfully" : "No posts found",
    "",
    data,
    200,
  );
};

/**
 * Get Post by ID
 * @description Fetch the full details of a single post by its ID.
 * @route GET /api/post/:postId
 * @access Private
 */
exports.getPostById = async (req, res) => {
  const post = await postService.getPostById(req);
  if (!post) {
    return errorResponse(res, "Post not found", "", "", 400);
  }

  return successResponse(res, "Post fetched successfully", "", post, 200);
};

/**
 * Update Post
 * @description Allow the post owner to update the content or images of their post.
 * @route PUT /api/post/:postId
 * @access Private
 */
exports.editPost = async (req, res, next) => {
  const { id: userId } = req.user;

  const post = await postService.updatePost(req, userId);
  if (!post) {
    return errorResponse(res, "Post not found", "", "", 400);
  }

  return successResponse(res, "Post updated successfully", "", post, 200);
};

/**
 * Delete Post
 * @description Permanently delete a post by its ID.
 * @route DELETE /api/post/:postId
 * @access Private
 */
exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;

  const post = await postService.deletePost(postId);
  if (!post) {
    return errorResponse(res,"Post not found","","",400);
  }
  
  return successResponse(res,"Post deleted successfully","","",200);
};
