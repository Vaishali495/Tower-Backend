const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");
const { JWT_SECRET_KEY } = require("../config");

const requestCounts = {};

const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  if (!token) {
    return res.status(403).send({
      success: false,
      message: "A token is required for authentication",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    var data = await userRepository.findUserRaw(decoded.id);
    if (!data) {
      // return res.status(400).send({ success: false, message: "Invalid User" });
      return res.status(401).send({ success: false, message: "Account has been deleted" });
    }
    req.user = decoded;

    // Count requests
    // requestCounts[data.name] = (requestCounts[data.name] || 0) + 1;

    // console.log(
    //   `[${new Date().toLocaleString()}] ` +
    //     `User: ${data.name} | ` +
    //     `Request #${requestCounts[data.name]} | ` +
    //     `${req.method} ${req.originalUrl}`,
    // );

  } catch (err) {
    return res.status(401).send({ success: false, message: "Invalid Token" });
  }
  return next();
};

module.exports = auth;
