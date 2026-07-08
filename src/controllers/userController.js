/**
 * =============================================================================
 * USER CONTROLLER - USER MANAGEMENT ENDPOINTS
 * =============================================================================
 *
 * This controller provides HTTP endpoints for user management,
 * including creating, fetching, updating, and deleting users and their profiles.
 *
 * =============================================================================
 */

const userService = require("../services/user.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Get User by ID
 * @description Fetch a single user's details by their ID, including a generated profile image URL.
 * @route GET /api/user/getuser/:userId
 * @access Private (Admin)
 */
exports.getUserById = async (req, res) => {
  const user = await userService.getUserById(req);
  if (!user) return errorResponse(res, "User not found", "error", "", 400);

  return successResponse(res, "User fetched successfully", "", user, 200);
};

/**
 * Add Admin
 * @description Create a new admin account. Rejects if an account with the same email already exists.
 * @route POST /api/user/add-admin
 * @access Private (Admin)
 */
exports.addAdmin = async (req, res) => {
  const data = await userService.createAdmin(req);
  if (data.error)
    return errorResponse(
      res,
      data.error.message,
      "error",
      "",
      data.error.status,
    );

  return successResponse(res, "Admin created successfully", "", data, 200);
};

/**
 * Add User
 * @description Create a new user (tenant or technician) along with their role-specific profile.
 *              Rejects if an account with the same email or mobile number already exists.
 * @route POST /api/user/adduser
 * @access Private (Admin)
 */
exports.addUser = async (req, res, next) => {
  const { data, error } = await userService.createUserWithProfile(req);
  if (error) {
    return errorResponse(res, error.message, "error", "", error.status);
  }

  return successResponse(res, "User created successfully", "", data, 200);
};

/**
 * Update Password
 * @description Reset a user's password by providing their ID and a new plain-text password.
 *              The password is hashed before being persisted.
 * @route PATCH /api/user/update-password
 * @access Private (Admin)
 */
exports.updatePassword = async (req, res) => {
  const user = await userService.updatePassword(req);
  if (!user) return errorResponse(res, "User not found", "error", "", 400);

  return successResponse(res, "Password updated successfully", "", "", 200);
};

/**
 * Get Users List
 * @description Fetch a paginated list of all users, optionally filtered by role.
 *              Defaults to page 1 with a limit of 20 results.
 * @route GET /api/user/userslist
 * @access Private (Admin)
 */
exports.getUsersList = async (req, res) => {
  const { data } = await userService.getUserslist(req);

  return successResponse(
    res,
    data.users.length ? "User list fectched successfully" : "No users found",
    "",
    data,
    200,
  );
};

/**
 * Update User Profile
 * @description Update a user's core fields and their role-specific profile (tenant or technician).
 *              If a new profile image is uploaded, the existing one is deleted from storage first.
 *              Only non-empty update objects are written to the database.
 * @route PUT /api/user/update-profile
 * @access Private (Admin)
 */
exports.updateProfile = async (req, res) => {
  const { data, error } = await userService.buildProfileUpdates(req);
  if (error)
    return errorResponse(res, error.message, "error", "", error.status);

  return successResponse(
    res,
    "User profile updated successfully",
    "",
    data,
    200,
  );
};

/**
 * Delete User
 * @description Permanently delete a user and all associated data, including their
 *              profile image, complaints, and notifications.
 * @route DELETE /api/user/users/:userId
 * @access Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  const user = await userService.deleteUser(req);
  if (!user) return errorResponse(res, "User not found", "error", "", 400);

  return successResponse(res, "User deleted successfully", "", "", 200);
};

// exports.testError = async (req, res, next) => {
//   try {
//     // intentionally throw error
//     // throw new Error("This is a test error");

//     // OR
//     const err = new Error("I am error message");
//     throw err;

//   } catch (error) {
//     next(error);
//   }
// };
