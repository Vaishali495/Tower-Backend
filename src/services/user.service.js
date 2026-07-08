const { ROLE, UPLOAD_TYPES } = require("../constants/enums");
const TenantProfile = require("../models/tenantProfile.model");
const TechnicianProfile = require("../models/technicianProfile.model");
const {
  normalizedEmail,
  hashPassword,
  generateFileUrl,
} = require("../utils/helper");
const userRepository = require("../repositories/user.repository");
const uploadService = require("./upload.service");
const Complaint = require("../models/complaint.model");
const Notification = require("../models/notification.model");

const createTenantProfile = async (user, body) => {
  const payload = {
    user: user._id,
    floor: body.floor,
    companyName: body.companyName,
    building: body.building,
  };
  const profile = await TenantProfile.create(payload);

  await userRepository.updateUserById(user._id, {
    tenantProfile: profile._id,
  });

  return profile;
};

const createTechnicianProfile = async (user, body) => {
  const payload = {
    user: user._id,
    designation: body.designation,
    experience: body.experience,
    availabilityStatus: body.availabilityStatus || "Available",
  };
  const profile = await TechnicianProfile.create(payload);

  await userRepository.updateUserById(user._id, {
    technicianProfile: profile._id,
  });

  return profile;
};

exports.createProfile = async (user, body) => {
  switch (user.role) {
    case ROLE.TENANT:
      return await createTenantProfile(user, body);

    case ROLE.TECHNICIAN:
      return await createTechnicianProfile(user, body);

    default:
      return null;
  }
};

exports.createAdmin = async (req) => {
  const { email, password, name, mobileNumber } = req.body;
  const normalizeEmail = normalizedEmail(email);
  const existing = await userRepository.findUserByEmail(normalizeEmail);
  if (existing)
    return {
      error: { message: "Admin with this email already exists", status: 400 },
    };

  //Upload file(if exists)
  const uploadedFiles = await uploadService.uploadFiles(
    req,
    UPLOAD_TYPES.PROFILE,
  );

  const payload = {
    name,
    email: normalizeEmail,
    password: await hashPassword(password),
    role: ROLE.ADMIN,
    mobileNumber,
    image: uploadedFiles.savedFiles?.[0] || "",
  };

  const admin = await userRepository.createUser(payload);
  const result = (({ password, fcmToken, ...rest }) => rest)(admin.toObject());
  result.image = generateFileUrl(req, UPLOAD_TYPES.PROFILE, admin.image);

  return result;
};

exports.createUserWithProfile = async (req) => {
  const { email, password, name, mobileNumber, role } = req.body;

  const [existingEmail, existingMobile] = await Promise.all([
    userRepository.findUserByEmail(normalizedEmail(email)),
    userRepository.findUserByMobile(mobileNumber),
  ]);

  if (existingEmail)
    return {
      error: { message: "User with this email already exists", status: 400 },
    };
  if (existingMobile)
    return {
      error: {
        message: "User with this mobile number already exists",
        status: 400,
      },
    };

  const uploadedFiles = await uploadService.uploadFiles(
    req,
    UPLOAD_TYPES.PROFILE,
  );

  // Base payload
  const payload = {
    name,
    email: normalizedEmail(email),
    password: await hashPassword(password),
    role,
    mobileNumber,
    image: uploadedFiles.savedFiles?.[0] || "",
  };

  const user = await userRepository.createUser(payload);

  await exports.createProfile(user, req.body);

  const finalUser = await userRepository.findUserById(user._id);
  finalUser.image = generateFileUrl(req, UPLOAD_TYPES.PROFILE, finalUser.image);
  return { data: finalUser };
};

exports.getUserById = async (req) => {
  const { userId } = req.params;
  const user = await userRepository.findUserById(userId);
  if (!user) return null;

  user.image = generateFileUrl(req, UPLOAD_TYPES.PROFILE, user.image);
  return user;
};

exports.buildProfileUpdates = async (req) => {
  let { userId, ...updatedData } = req.body;
  const user = await userRepository.findUserRaw(userId);
  if (!user) return { error: { message: "User not found", status: 400 } };

  // Handle image update
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length) {
    if (user.image)
      await uploadService.deleteFiles(user.image, UPLOAD_TYPES.PROFILE);
    const uploadedFiles = await uploadService.saveFiles(
      files,
      UPLOAD_TYPES.PROFILE,
    );
    req.uploadedFiles = uploadedFiles;
    updatedData.image = uploadedFiles.savedFiles[0];
  }

  const FIELD_MAP = {
    User: ["name", "mobileNumber", "email", "image"],
    TenantProfile: ["floor", "companyName", "building"],
    TechnicianProfile: ["designation", "experience", "availabilityStatus"],
  };

  const updates = { User: {}, TenantProfile: {}, TechnicianProfile: {} };
  Object.entries(updatedData).forEach(([key, value]) => {
    for (const model in FIELD_MAP) {
      if (FIELD_MAP[model].includes(key)) {
        updates[model][key] = value;
        break;
      }
    }
  });
  await Promise.all([
    Object.keys(updates.User).length &&
      userRepository.updateUserById(userId, updates.User),

    user.tenantProfile &&
      Object.keys(updates.TenantProfile).length &&
      TenantProfile.findByIdAndUpdate(
        user.tenantProfile,
        { $set: updates.TenantProfile },
        { runValidators: true },
      ),

    user.technicianProfile &&
      Object.keys(updates.TechnicianProfile).length &&
      TechnicianProfile.findByIdAndUpdate(
        user.technicianProfile,
        { $set: updates.TechnicianProfile },
        { runValidators: true },
      ),
  ]);

  const finalUser = await userRepository.findUserById(userId);
  finalUser.image = generateFileUrl(req, UPLOAD_TYPES.PROFILE, finalUser.image);

  return { data: finalUser };
};

exports.updatePassword = async (req) => {
  const { userId, password } = req.body;
  const hashedPassword = await hashPassword(password);

  const user = await userRepository.updateUserById(userId, {
    password: hashedPassword,
  });
  if (!user) return null;
  return user;
};

exports.getUserslist = async (req) => {
  // Get page & limit from query (default values)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const { role } = req.query;
  // Create filter
  const filter = {
    ...(Object.values(ROLE).includes(role) && { role }),
  };

  // Get users + count in parallel
  const [userList, totalUsers] = await Promise.all([
    userRepository.findUsers(filter, skip, limit),
    userRepository.countUsers(filter),
  ]);

  // Generate image URLs
  const users = userList.map((user) => {
    user.image = generateFileUrl(req, UPLOAD_TYPES.PROFILE, user.image);
    return user;
  });

  return {
    data: {
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    },
  };
};

exports.deleteUser = async (req) => {
  const { userId } = req.params;
  const user = await userRepository.findUserRaw(userId);
  if (!user) return null;

  // Delete profile image
  if (user.image) {
    await uploadService.deleteFiles(user.image, UPLOAD_TYPES.PROFILE);
  }

  // Fetch complaint IDs before deletion
  const complaints = await Complaint.find({ createdBy: userId }).select("_id");
  const complaintIds = complaints.map((c) => c._id);

  // Delete related data
  await Promise.all([
    Complaint.deleteMany({ createdBy: userId }),

    Notification.deleteMany({
      $or: [
        { notificationFor: userId },
        { referenceId: { $in: complaintIds } },
      ],
    }),
  ]);

  //Delete
  await userRepository.deleteUserById(userId);
  return user;
};
