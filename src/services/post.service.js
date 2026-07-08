const { generateFileUrl, formatUser } = require("../utils/helper");
const notificationService = require("./notification.service");
const uploadService = require("./upload.service");
const postRepository = require("../repositories/post.reposiory");
const notificationRepository = require("../repositories/notification.repository");
const {
  REFERENCE_MODEL,
  ROLE,
  UPLOAD_TYPES,
  NOTIFICATION_TYPE,
} = require("../constants/enums");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPost = (req, post) => ({
  ...post,
  image: post.image.map((img) => generateFileUrl(req, UPLOAD_TYPES.POST, img)),
  postedBy: formatUser(req, post.postedBy),
});

const sendPostNotification = (title, post, type, userId) => {
  process.nextTick(() => {
    notificationService.notify({
      title,
      item: post,
      type,
      model: REFERENCE_MODEL.POST,
      target: { role: ROLE.TENANT },
      createdBy: userId,
    });
  });
};

// ─── Service Methods ──────────────────────────────────────────────────────────

exports.createPost = async (req, userId) => {
  const { title, description } = req.body;

  const uploadedFiles = await uploadService.uploadFiles(req, UPLOAD_TYPES.POST);

  const payload = {
    postedBy: userId,
    title,
    description,
    image: uploadedFiles.savedFiles,
  };
  const post = await postRepository.createPost(payload);

  const populatedPost = await postRepository.findPostById(post._id);
  const formatted = formatPost(req, populatedPost);

  sendPostNotification(
    title ? `News Added: ${title}` : "News Added",
    formatted,
    NOTIFICATION_TYPE.POST_CREATED,
    userId,
  );

  return formatted;
};

exports.getAllPosts = async (req) => {
  const {id: userId} = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Mark notifications read of the posts
  const notifications = await notificationRepository.markReadByModelName(
    REFERENCE_MODEL.POST,
    userId,
  );
  const unreadCount = await notificationRepository.countUnread(userId);

  const [posts, totalPosts] = await Promise.all([
    postRepository.findAllPosts(skip, limit),
    postRepository.countPosts(),
  ]);

  return {
    posts: posts.map((post) => formatPost(req, post)),
    pagination: {
      total: totalPosts,
      page,
      limit,
      totalPages: Math.ceil(totalPosts / limit),
    },
    unreadCount,
  };
};

exports.getPostById = async (req) => {
  const { postId } = req.params;

  const post = await postRepository.findPostById(postId);
  if (!post) return null;

  return formatPost(req, post);
};

exports.updatePost = async (req, userId) => {
  const { postId } = req.params;
  const { title, description } = req.body;

  const post = await postRepository.findPostByIdRaw(postId);
  if (!post) return null;

  const updateData = {
    title: title ?? post.title,
    description: description ?? post.description,
  };

  // Handle image swap
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length) {
    if (post.image?.length) {
      await uploadService.deleteFiles(post.image, UPLOAD_TYPES.POST);
    }
    const uploaded = await uploadService.saveFiles(files, UPLOAD_TYPES.POST);
    req.uploadedFiles = uploaded;
    updateData.image = uploaded.savedFiles;
  }

  const updatedPost = await postRepository.updatePostById(postId, updateData);
  const formatted = formatPost(req, updatedPost);

  sendPostNotification(
    title ? `News Updated: ${title}` : "News Updated",
    formatted,
    NOTIFICATION_TYPE.POST_UPDATED,
    userId,
  );

  return formatted;
};

exports.deletePost = async (postId) => {
  const post = await postRepository.findPostByIdRaw(postId);
  if (!post) return false;

  if (post.image?.length) {
    await uploadService.deleteFiles(post.image, UPLOAD_TYPES.POST);
  }

  await Promise.all([
    postRepository.deletePostNotifications(post._id),
    postRepository.deletePostById(postId),
  ]);

  return true;
};
