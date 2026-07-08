const User = require("../models/user.model");

exports.findUserByEmail = async (email) =>
  User.findOne({ email })
    // .select("-password -fcmToken")
    .populate("tenantProfile")
    .populate("technicianProfile");

exports.findUserByMobile = async (mobileNumber) =>
  User.findOne({ mobileNumber: mobileNumber })
    // .select("-password -fcmToken")
    .populate("tenantProfile")
    .populate("technicianProfile");

exports.findUserById = (id) =>
  User.findById(id)
    .select("-password -fcmToken")
    .populate("tenantProfile")
    .populate("technicianProfile")
    .lean();

exports.findUserRaw = (id) => User.findById(id); // for mutation checks

exports.createUser = (payload) => User.create(payload);

exports.updateUserById = (id, data) =>
  User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );

exports.removeUserFcmToken = (id, fcmToken) =>
  User.findByIdAndUpdate(id, { $pull: { fcmToken } }, { new: true });

exports.deleteUserById = (id) => User.findByIdAndDelete(id);

exports.findUsers = (filter, skip, limit) =>
  User.find(filter, "-password -confirmPassword")
    .skip(skip)
    .limit(limit)
    .populate("tenantProfile technicianProfile")
    .sort({ createdAt: -1 })
    .lean();

exports.countUsers = (filter) => User.countDocuments(filter);
