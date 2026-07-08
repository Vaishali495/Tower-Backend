const Post = require("../models/post.model");
const Notification = require("../models/notification.model");
const { REFERENCE_MODEL } = require("../constants/enums");

exports.createPost = (payload) => Post.create(payload);

exports.findPostById = (id) =>
  Post.findById(id)
    .populate({ path: "postedBy", select: "name email image" })
    .lean();

exports.findPostByIdRaw = (id) => Post.findById(id);

exports.findAllPosts = (skip, limit) =>
  Post.find()
    .populate({ path: "postedBy", select: "name email image" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

exports.countPosts = () => Post.countDocuments();

exports.updatePostById = (id, data) =>
  Post.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate({ path: "postedBy", select: "name email image" })
    .lean();

exports.deletePostById = (id) => Post.findByIdAndDelete(id);

exports.deletePostNotifications = (postId) =>
  Notification.deleteMany({
    referenceId: postId,
    referenceModel: REFERENCE_MODEL.POST,
  });