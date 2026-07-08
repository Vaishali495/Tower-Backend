const authService = require("../services/auth.service");
const { errorResponse, successResponse } = require("../utils/response");

/**
 * Login User
 * @description Authenticate user credentials and return access token with user data
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  const { data, error } = await authService.loginUser(req);
  if (error)
    return errorResponse(res, error.message, "error", "", error.status);

  return successResponse(res, "Login successful", "", data, 200);
};

/**
 * Logout User
 * @description Logout authenticated user and clear token
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = async (req, res) => {
  const { id: userId } = req.user;
  const { fcmToken } = req.body;

  const { error } = await authService.logoutUser(userId, fcmToken);
  if (error)
    return errorResponse(res, error.message, "error", "", error.status);

  return successResponse(res, "Logout successful", "", "", 200);
};
