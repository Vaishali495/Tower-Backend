const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../config");
const path = require("path");
const { UPLOAD_TYPES } = require("../constants/enums");

const normalizedEmail = (email) => {
  return email.trim().toLowerCase();
}
const complaintModel = require("../models/complaint.model");

// const getUniqueId = () => {
//   const timestamp = Date.now().toString().slice(-4); // last 4 digits of ms e.g. 5823
//   const random = Math.random().toString(36).substring(2, 4).toUpperCase(); // 2 chars e.g. A3
//   return `VBT-${random}${timestamp}`; // e.g. VBT-A35823
// };

const getUniqueId = async () => {
  const lastComplaint = await complaintModel.findOne(
    {},
    { complaintId: 1 },
    { sort: { createdAt: -1 } },
  ).lean();

  const prefix = "VBT";
  const padLength = 4;

  if (!lastComplaint?.complaintId) {
    return `${prefix}-0001`;
  }

  // Extract numeric part from last ID e.g. "VBT-00042" → 42
  const lastNumber = parseInt(lastComplaint.complaintId.split("-")[1], 10);
  const nextNumber = (isNaN(lastNumber) ? 0 : lastNumber) + 1;

  return `${prefix}-${String(nextNumber).padStart(padLength, "0")}`;
};

// const getUniqueCode = (lastCount, building) => {
//   //Generate ComplaintId
//   let newComplaintId = building.includes("VISTA 1")
//     ? /^\d$/.test(lastCount)
//       ? `VST10${lastCount + 1}`
//       : `VST1${lastCount + 1}`
//     : /^\d$/.test(lastCount)
//       ? `VST20${lastCount + 1}`
//       : `VST2${lastCount + 1}`;
//   return newComplaintId;
// };

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = async (payload) => {
  return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "7d" });
};

const handleFcmToken = async (user, fcmToken, cachedData) => {
  if (!user.fcmToken?.includes(fcmToken)) {
    user.fcmToken = user.fcmToken || [];
    user.fcmToken.push(fcmToken);

    cachedData.setToken(fcmToken, user._id);
    await user.save();
  }
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// swagger.utils.js
const enumToSwagger = (enumObj) => Object.values(enumObj);

// const generateFileUrl = (req, folder, file) => {
//   if (!file) return "";

//   return file.startsWith("http")
//     ? file
//     : `${req.protocol}://${req.get("host")}/uploads/${folder}/${file}`;
// };

const generateFileUrl = (req , folder, file) => {
  if (!file) return "";

  // Extract filename if full URL already exists
  const fileName = file.split("/").pop();
  return `${BASE_URL}/uploads/${folder}/${fileName}`;
  // return `${req.protocol}://${req.get("host")}/uploads/${folder}/${fileName}`;
};

const formatUser = (req, user) =>
  user && {
    ...user,
    image: generateFileUrl(req, UPLOAD_TYPES.PROFILE, user.image),
  };

module.exports = {
  normalizedEmail,
  getUniqueId,
  comparePassword,
  generateToken,
  handleFcmToken,
  hashPassword,
  enumToSwagger,
  generateFileUrl,
  formatUser,
};
