const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // max 3 requests per minute
  handler: (req, res) => {
    console.log("Blocked:", req.method, req.originalUrl);
    res
      .status(429)
      .json({ success: false, message: "Too many requests. Try again later." });
  },
});
module.exports = limiter;
