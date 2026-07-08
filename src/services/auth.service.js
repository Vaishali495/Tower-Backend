const { CachedTokens } = require("../services/caching");
const cachedData = new CachedTokens();
const {
  normalizedEmail,
  comparePassword,
  handleFcmToken,
  generateFileUrl,
  generateToken,
} = require("../utils/helper");
const userRepository = require("../repositories/user.repository");
const notificationRepository = require("../repositories/notification.repository");
const { UPLOAD_TYPES } = require("../constants/enums");

/**
 * Authenticate user and return token + user data
 */
exports.loginUser = async (req) => {
  const { email, password, fcmToken } = req.body;
  const normalizedUserEmail = normalizedEmail(email);

  const user = await userRepository.findUserByEmail(normalizedUserEmail);
  if (!user) return { error: { message: "User not found", status: 400 } };

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid)
    return { error: { message: "Invalid credentials", status: 401 } };

  await handleFcmToken(user, fcmToken, cachedData);

  const token = await generateToken({
    email: user.email,
    id: user._id,
    role: user.role,
  });

  const result = (({ password, fcmToken, ...rest }) => rest)(user.toObject());
  result.image = generateFileUrl(req, UPLOAD_TYPES.PROFILE, result.image);
  const unreadNotificationCount = await notificationRepository.countUnread(
    user._id,
  );

  return { data: { user: result, unreadNotificationCount, token } };
};

/**
 * Remove FCM token on logout and clear from cache
 */
exports.logoutUser = async (userId, fcmToken) => {
  const user = await userRepository.removeUserFcmToken(userId, fcmToken);
  if (!user) return { error: { message: "User not found", status: 400 } };

  let tokenList = cachedData.getToken(userId);
  if (tokenList) {
    tokenList.delete(fcmToken);

    if (tokenList.size) cachedData.cachedData[userId] = tokenList;
    else cachedData.delTokenKey(userId);
  }
  //   const allTokens = cachedData.getAllTokens()?.flat();

  return { data: null };
};
