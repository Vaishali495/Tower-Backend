/**
 * =============================================================================
 * COMPLAINT CONTROLLER - COMPLAINT MANAGEMENT ENDPOINTS
 * =============================================================================
 *
 * This controller provides HTTP endpoints for complaint management,
 * including complaint registration, updates, retrieval, and deletion.
 *
 * =============================================================================
 */

const mongoose = require("mongoose");
const Complaint = require("../models/complaint.model");
const Notification = require("../models/notification.model");
const complaintMessage = require("../models/complaintMessage.model");
const { handleReopenComplaint } = require("../services/complaint.service");
const { saveFiles, deleteFiles } = require("../services/upload.service");
const {
  getUniqueCode,
  generateFileUrl, getUniqueId,
  formatUser,
} = require("../utils/helper");
const { User, Technician } = require("../models/user.model");
const { messaging } = require("../firebaseConfig/firebase");
const { CachedTokens } = require("../services/caching");
const {
  STATUS,
  UPLOAD_TYPES,
  NOTIFICATION_TYPE,
  ASSIGNED_COMPLAINT_STATUS,
  ROLE,
  REFERENCE_MODEL,
} = require("../constants/enums");
const notify = require("../services/notification.service");
const cachedData = new CachedTokens();
/**
 * =============================================================================
 * COMPLAINT REGISTRATION ENDPOINTS
 * =============================================================================
 */

/**
 * Register a new complaint
 * POST /
 */
exports.registerComplaint = async (req, res) => {
  const {
    title,
    concernedDepartments,
    daysFacingIssue,
    description,
    building,
    // floor,
    // companyName,
  } = req.body;

  const { id: userId } = req.user;
  const complaintLength = await Complaint.countDocuments();

  const files = Array.isArray(req.files) ? req.files : [];

  let uploadedFiles = files.length
    ? await saveFiles(files, UPLOAD_TYPES.COMPLAINT)
    : { savedFiles: [] };
  if (files.length) req.uploadedFiles = uploadedFiles;

  const payload = {
    title,
    createdBy: userId,
    concernedDepartments,
    daysFacingIssue,
    description,
    building,
    // floor,
    // companyName,
    image: uploadedFiles.savedFiles,
    complaintId: getUniqueId(),
  };
  const complaint = await Complaint.create(payload);

  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate({
      path: "createdBy",
      select: "name email image companyName",
    })
    .lean();

  // Generate complaint image URLs
  populatedComplaint.image = populatedComplaint.image.map((img) =>
    generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
  );

  populatedComplaint.createdBy = formatUser(req, populatedComplaint.createdBy);

  process.nextTick(() => {
    notify({
      title: `${populatedComplaint.createdBy?.name} (${populatedComplaint.createdBy?.companyName}) created a complaint: ${complaint.title}`,
      item: populatedComplaint,
      type: NOTIFICATION_TYPE.COMPLAINT_CREATED,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { role: ROLE.ADMIN },
      createdBy: userId,
    });
  });

  return res.status(200).json({
    success: true,
    message: "Complaint registered successfully",
    data: populatedComplaint,
  });
};

/**
 * =============================================================================
 * COMPLAINT FETCH ENDPOINTS
 * =============================================================================
 */

/**
 * Get all registered complaints
 * GET /
 */
exports.getRegisteredComplaints = async (req, res) => {
  const { role, id } = req.user;

  // Get page & limit from query (default values)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Role-based query
  const query =
    role === ROLE.TENANT
      ? { createdBy: id }
      : role === ROLE.TECHNICIAN
        ? { technicianId: id }
        : {};

  // Run queries in parallel
  let [complaints, totalComplaints, statusCounts] = await Promise.all([
    Complaint.find(query)
      .populate({
        path: "createdBy",
        select: "name email image companyName",
      })
      .populate({
        path: "technicianId",
        select: "name email image designation",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),

    Complaint.countDocuments(query),

    Complaint.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Convert aggregation result into object
  // const complaintCounts = {
  //   pending: 0,
  //   inProgress: 0,
  //   resolved: 0,
  // };

  // statusCounts.forEach((item) => {
  //   if (item._id === STATUS.PENDING) {
  //     complaintCounts.pending = item.count;
  //   }

  //   if (item._id === STATUS.IN_PROGRESS) {
  //     complaintCounts.inProgress = item.count;
  //   }

  //   if (item._id === STATUS.RESOLVED) {
  //     complaintCounts.resolved = item.count;
  //   }
  // });

  const complaintCounts = statusCounts.reduce(
    (acc, { _id, count }) => {
      if (_id === STATUS.PENDING) acc.pending = count;
      if (_id === STATUS.IN_PROGRESS) acc.inProgress = count;
      if (_id === STATUS.RESOLVED) acc.resolved = count;
      return acc;
    },
    { pending: 0, inProgress: 0, resolved: 0 },
  );

  // Generate image URLs
  complaints = complaints.map((complaint) => ({
    ...complaint,
    image: complaint.image.map((img) =>
      generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
    ),
    createdBy: formatUser(complaint.createdBy),
    technicianId: formatUser(complaint.technicianId),
  }));

  res.status(200).json({
    success: true,
    message: complaints.length
      ? "Complaints fetched successfully"
      : "No complaints found",
    data: complaints,
    counts: complaintCounts,
    pagination: {
      total: totalComplaints,
      page,
      limit,
      totalPages: Math.ceil(totalComplaints / limit),
    },
  });
};

/**
 * =============================================================================
 * COMPLAINT FILTER ENDPOINTS
 * =============================================================================
 */

/**
 * Get complaints by status
 * GET /
 */
exports.getComplaintsByStatus = async (req, res) => {
  const { status } = req.params;
  const user = req.user;
  // Get page & limit from query (default values)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const skip = (page - 1) * limit;

  // Base query
  const query = { status };
  // Query for counts (without status filter)
  const countQuery = {};

  // Role-based filtering
  if (user.role === ROLE.USER) {
    query.userId = new mongoose.Types.ObjectId(user.id);
    countQuery.userId = new mongoose.Types.ObjectId(user.id);
  }

  if (user.role === ROLE.TECHNICIAN) {
    query.technicianId = new mongoose.Types.ObjectId(user.id);
    countQuery.technicianId = new mongoose.Types.ObjectId(user.id);
  }

  // Run queries in parallel
  let [complaints, totalComplaints, statusCounts] = await Promise.all([
    Complaint.find(query)
      .populate({
        path: "userId",
        select: "name email image",
      })
      .populate({
        path: "technicianId",
        select: "name email image designation",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),

    Complaint.countDocuments(query),

    Complaint.aggregate([
      { $match: countQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Generate image URLs
  complaints = complaints.map((complaint) => ({
    ...complaint,

    image: Array.isArray(complaint.image)
      ? complaint.image.map((img) => ({
          ...img,
          url: generateFileUrl(req, "complaint", img?.url),
        }))
      : [],

    userId: complaint.userId
      ? {
          ...complaint.userId,
          image: {
            url: generateFileUrl(req, "profile", complaint.userId?.image?.url),
          },
        }
      : null,

    technicianId: complaint.technicianId
      ? {
          ...complaint.technicianId,
          image: {
            url: generateFileUrl(
              req,
              "profile",
              complaint.technicianId?.image?.url,
            ),
          },
        }
      : null,
  }));

  // Convert aggregation result into object
  const complaintCounts = {
    pending: 0,
    inProgress: 0,
    resolved: 0,
  };

  statusCounts.forEach((item) => {
    if (item._id === STATUS.PENDING) {
      complaintCounts.pending = item.count;
    }

    if (item._id === STATUS.IN_PROGRESS) {
      complaintCounts.inProgress = item.count;
    }

    if (item._id === STATUS.RESOLVED) {
      complaintCounts.resolved = item.count;
    }
  });

  res.status(200).json({
    success: true,
    message:
      complaints.length > 0
        ? "Complaints fetched successfully"
        : "No complaints found",
    data: complaints,
    counts: complaintCounts,
    pagination: {
      total: totalComplaints,
      page,
      limit,
      totalPages: Math.ceil(totalComplaints / limit),
    },
  });
};

/**
 * Get registered complaint by id
 * GET /
 */
exports.getComplaintById = async (req, res) => {
  const { complaintId } = req.params;

  const complaint = await Complaint.findById(complaintId).populate({
    path: "userId",
    select: "name email image",
  });

  if (!complaint) {
    return res
      .status(404)
      .json({ success: false, message: "Complaint not found" });
  }

  // Convert complaint image URLs
  if (complaint.image?.length) {
    complaint.image = complaint.image.map((img) => ({
      ...img.toObject(),
      url: img.url ? generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img.url) : "",
    }));
  }

  // Convert user profile image URL
  if (complaint.userId?.image?.url) {
    complaint.userId.image.url = generateFileUrl(
      req,
      UPLOAD_TYPES.PROFILE,
      complaint.userId.image.url,
    );
  }

  res.status(200).json({
    success: true,
    message: "Complaint fetched successfully",
    data: complaint,
  });
};

/**
 * =============================================================================
 * ADMIN COMPLAINT MANAGEMENT ENDPOINTS
 * =============================================================================
 */

/**
 * Update complaint details by admin
 * PUT /:complaintId
 *
 * Allows admin to update:
 * - status
 * - severity
 * - admin comments
 */
exports.updateComplaintByAdmin = async (req, res) => {
  const { id: userId } = req.user;
  const { complaintId } = req.params;
  const { status, adminComment, severity } = req.body;

  const updateQuery = {};

  if (status || severity) {
    updateQuery.$set = {};
    if (status) {
      updateQuery.$set.status = status;

      //Set resolvedAt only when complaint is resolved
      if (status === STATUS.RESOLVED) {
        updateQuery.$set.resolvedAt = new Date();
      }

      // clear resolvedAt if complaint is reopened/pending
      if (status === STATUS.REOPENED || status === STATUS.PENDING) {
        updateQuery.$set.resolvedAt = null;
      }
    }
    if (severity) updateQuery.$set.severity = severity;
  }

  if (adminComment) {
    updateQuery.$push = { adminComment };
  }

  const complaint = await Complaint.findByIdAndUpdate(
    complaintId,
    updateQuery,
    { new: true, runValidators: true },
  )
    .populate({
      path: "createdBy",
      select: "name email image",
    })
    .populate({
      path: "technicianId",
      select: "name email image designation",
    })
    .lean();

  if (!complaint) {
    return res
      .status(404)
      .json({ success: false, message: "Complaint not found for this user" });
  }

  // Generate image URLs
  complaint.image = complaint.image.map((img) =>
    generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
  );
  complaint.createdBy = formatUser(complaint.createdBy);
  complaint.technicianId = formatUser(complaint.technicianId);

  let titleMessage = `Complaint Updated: ${complaint.title}`;

  if (status && !severity && !adminComment) {
    titleMessage = `Complaint Status updated to ${status}`;
  } else if (severity && !status && !adminComment) {
    titleMessage = `Complaint Severity updated to ${severity}`;
  } else if (adminComment && !status && !severity) {
    titleMessage = `New admin comment on: ${complaint.title}`;
  }

  // Prepare notification recipients
  const target = {
    userIds: [complaint.userId?._id, complaint.technicianId?._id].filter(
      Boolean,
    ),
  };

  process.nextTick(() => {
    notify({
      title: titleMessage,
      item: complaint,
      type: NOTIFICATION_TYPE.COMPLAINT_UPDATED_BY_ADMIN,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { userIds: [complaint.createdBy] },
      createdBy: userId,
    });
  });

  return res.status(200).json({
    success: true,
    message: titleMessage,
    data: complaint,
  });
};

/**
 * =============================================================================
 * USER COMPLAINT UPDATE ENDPOINTS
 * =============================================================================
 */

/**
 * Update specific complaint by user
 * PUT /:complaintId
 *
 * Allows user to update:
 * - complaint details
 * - add user comments
 * - upload new images
 * - reopen flag
 */
exports.updateComplaintByUser = async (req, res) => {
  const { id: userId } = req.user;
  const { complaintId } = req.params;
  const { userComment, reopen, ...updatedData } = req.body || {};

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
    });
  }

  // if (reopen !== undefined) {
  //   await handleReopenComplaint(complaint, reopen);
  // }

  // if (userComment) complaint.userComment.push(userComment);

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length) {
    if (complaint.image?.length) {
      await deleteFiles(complaint.image, UPLOAD_TYPES.COMPLAINT);
    }

    const uploadedFiles = await saveFiles(files, UPLOAD_TYPES.COMPLAINT);
    req.uploadedFiles = uploadedFiles;
    updatedData.image = uploadedFiles.savedFiles;
  }

  // Update all simple fields dynamically
  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaintId,
    { $set: updatedData },
    { new: true, runValidators: true },
  )
    .populate({
      path: "createdBy",
      select: "name email image companyName",
    })
    .populate({
      path: "technicianId",
      select: "name email image designation",
    })
    .lean();

  updatedComplaint.image = updatedComplaint.image.map((img) =>
    generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
  );

  updatedComplaint.createdBy = formatUser(updatedComplaint.createdBy);
  updatedComplaint.technicianId = formatUser(updatedComplaint.technicianId);

  process.nextTick(() => {
    notify({
      title: `Complaint updated by ${updatedComplaint.createdBy?.name} ${"("}${updatedComplaint.createdBy?.companyName}${")"}: ${updatedComplaint.title}`,
      item: updatedComplaint,
      type: NOTIFICATION_TYPE.COMPLAINT_UPDATED_BY_USER,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { role: ROLE.ADMIN },
      createdBy: userId,
    });
  });

  return res.status(200).json({
    success: true,
    message: "Complaint updated successfully",
    data: updatedComplaint,
  });
};

/**
 * =============================================================================
 * COMPLAINT MESSAGE ENDPOINTS
 * =============================================================================
 */
/**
 * Send complaint message
 * POST /message
 */
// exports.sendComplaintMessage = async (req, res) => {
//   const { complaintId, message, parentId } = req.body;
//   const userId = req.user?._id;

//   // Check complaint exists
//   const complaint = await Complaint.findById(complaintId);
//   if (!complaint) {
//     return res.status(404).json({
//       success: false,
//       message: "Complaint not found",
//     });
//   }

//   if (parentId) {
//     const parentMessage = await ComplaintMessage.findById(parentId);
//     if (!parentMessage) {
//       return res.status(404).json({
//         success: false,
//         message: "Parent message not found",
//       });
//     }
//     finalParentId = parentId;
//   }

//   //Handle media - pending
//   let mediaFiles = [];

//   // Create message
//   const newMessage = await ComplaintMessage.create({
//     complaintId,
//     createdBy: userId,
//     parentId: finalParentId,
//     message,
//     media: mediaFiles,
//   });

//   return res.status(201).json({
//     success: true,
//     message: "Message sent successfully",
//     data: newMessage,
//   });
// };

/**
 * =============================================================================
 * COMPLAINT Assign to technician
 * =============================================================================
 */

/**
 * Assign technician
 * PATCH /assign-technician
 */
exports.assignTechnician = async (req, res) => {
  const { id: userId } = req.user;
  const { complaintId, technicianId } = req.body;

  // Fetch complaint + technician in parallel
  const [complaint, technician] = await Promise.all([
    Complaint.findById(complaintId),
    Technician.findById(technicianId),
  ]);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
    });
  }

  // Prevent assigning resolved complaint
  if (complaint.status === STATUS.RESOLVED) {
    return res.status(400).json({
      success: false,
      message: "Resolved complaint cannot be assigned",
    });
  }

  if (!technician) {
    return res.status(404).json({
      success: false,
      message: "Technician not found",
    });
  }

  // Prevent duplicate assignment
  const alreadyAssigned = technician.assignedComplaints?.find(
    (item) =>
      item.complaintId?.toString() === complaintId &&
      item.status !== ASSIGNED_COMPLAINT_STATUS.CLOSED,
  );

  if (alreadyAssigned) {
    return res.status(400).json({
      success: false,
      message: "Complaint already assigned to this technician",
    });
  }

  /**
   * If complaint already assigned to another technician:
   * mark previous technician complaint status as CLOSED
   */
  if (complaint.technicianId) {
    await Technician.findOneAndUpdate(
      {
        _id: complaint.technicianId,
        "assignedComplaints.complaintId": complaintId,
      },
      {
        $set: {
          "assignedComplaints.$.status": ASSIGNED_COMPLAINT_STATUS.CLOSED,

          "assignedComplaints.$.completedAt": new Date(),
        },
      },
    );
  }

  // Assign complaint to new technician
  await Technician.findByIdAndUpdate(technicianId, {
    $push: {
      assignedComplaints: {
        complaintId,
        status: ASSIGNED_COMPLAINT_STATUS.ASSIGNED,
        assignedAt: new Date(),
      },
    },
  });

  // Update complaint technician
  const updatedComplaint = await Complaint.findByIdAndUpdate(
    complaintId,
    { technicianId },
    { new: true },
  )
    .populate({
      path: "createdBy",
      select: "name email image",
    })
    .populate({
      path: "technicianId",
      select: "name email image designation",
    })
    .lean();

  //Generate Image urls
  updatedComplaint.image = updatedComplaint.image.map((img) =>
    generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
  );
  updatedComplaint.createdBy = formatUser(updatedComplaint.createdBy);
  updatedComplaint.technicianId = formatUser(updatedComplaint.technicianId);

  process.nextTick(() => {
    notify({
      title: complaint.title
        ? `A complaint has been assigned to you: ${complaint.title}`
        : "New complaint assigned",
      item: updatedComplaint,
      type: NOTIFICATION_TYPE.TECH_ASSIGNED,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { userIds: [technicianId] },
      createdBy: userId,
    });
  });

  return res.status(200).json({
    success: true,
    message: "Technician assigned successfully",
    data: updatedComplaint,
  });
};

/**
 * =============================================================================
 * UPDATE technician status
 * =============================================================================
 */

/**
 * Update status
 * PATCH /technician-status
 */
exports.updateTechnicianStatus = async (req, res) => {
  const { id: userId } = req.user;
  const { complaintId, technicianStatus } = req.body;

  /**
   * Check technician and assigned complaint
   */
  const technician = await Technician.findOne({
    _id: userId,
    "assignedComplaints.complaintId": complaintId,
  });

  if (!technician) {
    return res.status(403).json({
      success: false,
      message: "This complaint is not assigned to you",
    });
  }

  /**
   * Get complaint first
   */
  const existingComplaint = await Complaint.findById(complaintId);

  if (!existingComplaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
    });
  }

  /**
   * Prevent status update if complaint already resolved
   */
  if (existingComplaint.status === STATUS.RESOLVED) {
    return res.status(400).json({
      success: false,
      message: "Complaint already resolved. Status cannot be updated",
    });
  }

  // Update complaint status
  const complaint = await Complaint.findByIdAndUpdate(
    complaintId,
    { technicianStatus },
    { new: true },
  )
    .populate({
      path: "createdBy",
      select: "name email image",
    })
    .populate({
      path: "technicianId",
      select: "name email image designation",
    })
    .lean();

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
    });
  }

  /**
   * Update technician assigned complaint status also
   */
  const updateData = {
    "assignedComplaints.$.status": technicianStatus,
  };

  // If resolved then set completedAt
  if (technicianStatus === ASSIGNED_COMPLAINT_STATUS.RESOLVED) {
    updateData["assignedComplaints.$.completedAt"] = new Date();
  }

  await Technician.updateOne(
    {
      _id: userId,
      "assignedComplaints.complaintId": complaintId,
    },
    {
      $set: updateData,
    },
  );

  // Generate Image urls
  complaint.image = complaint.image.map((img) =>
    generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
  );
  complaint.createdBy = formatUser(complaint.createdBy);
  complaint.technicianId = formatUser(complaint.technicianId);

  process.nextTick(() => {
    notify({
      // title: "Complaint status updated by technician",
      title: `${complaint.technicianId?.name}(${complaint.technicianId?.designation}) marked complaint as ${technicianStatus}`,
      item: complaint,
      type: NOTIFICATION_TYPE.TECH_STATUS_UPDATED,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { role: ROLE.ADMIN }, // key
      createdBy: userId,
    });
  });

  return res.status(200).json({
    success: true,
    message: "Complaint status updated successfully",
    data: complaint,
  });
};

/**
 * =============================================================================
 * COMPLAINT DELETE ENDPOINTS
 * =============================================================================
 */

/**
 * Delete complaint
 * DELETE /:complaintId
 */
exports.deleteComplaint = async (req, res) => {
  const { complaintId } = req.params;
  //also map userId present in the complaint and login user
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    return res
      .status(404)
      .json({ success: false, message: "Complaint not found" });
  }
  // delete related chat
  // await complaintChatModel.deleteOne({ complaintId });

  // Delete uploaded files
  if (complaint.image?.length) {
    await deleteFiles(complaint.image, UPLOAD_TYPES.COMPLAINT);
  }

  await Notification.deleteMany({
    referenceId: complaint._id,
    referenceModel: NOTIFICATION_TYPE.COMPLAINT,
  });
  await Complaint.findByIdAndDelete(complaintId);

  return res
    .status(200)
    .json({ success: true, message: "Complaint deleted successfully" });
};
