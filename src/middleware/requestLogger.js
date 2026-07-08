const requestCounts = {};

const requestLogger = (req, res, next) => {
  const userName = req.user?.name || "Guest";
  const userId = req.user?._id || req.ip; // fallback for unauthenticated users

  // Increase count
  requestCounts[userId] = (requestCounts[userId] || 0) + 1;

  console.log(
    `[${new Date().toLocaleString()}] ` +
    `User: ${userName} | ` +
    `Request #${requestCounts[userId]} | ` +
    `${req.method} ${req.originalUrl}`
  );

  next();
};

module.exports = requestLogger;