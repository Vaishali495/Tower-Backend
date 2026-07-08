const {
  UPLOAD_TYPES,
  STATUS,
  ROLE,
  NOTIFICATION_TYPE,
  REFERENCE_MODEL,
} = require("../constants/enums");
const { formatUser, generateFileUrl, getUniqueId } = require("../utils/helper");
const uploadService = require("./upload.service");
const complaintRepository = require("../repositories/complaint.repository");
const notificationRepository = require("../repositories/notification.repository");
const notificationService = require("../services/notification.service");
const mongoose = require("mongoose");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatComplaint = (req, complaint) => ({
  ...complaint,
  image: complaint.image.map((img) =>
    generateFileUrl(req, UPLOAD_TYPES.COMPLAINT, img),
  ),
  createdBy: formatUser(req, complaint.createdBy),
  technicianId: formatUser(req, complaint.technicianId),
});

const buildStatusCounts = (statusCounts) =>
  statusCounts.reduce(
    (acc, { _id, count }) => {
      if (_id === STATUS.PENDING) acc.pending = count;
      if (_id === STATUS.IN_PROGRESS) acc.inProgress = count;
      if (_id === STATUS.RESOLVED) acc.resolved = count;
      return acc;
    },
    { pending: 0, inProgress: 0, resolved: 0 },
  );

const buildRoleQuery = (role, id) => {
  const userId = new mongoose.Types.ObjectId(id);
  if (role === ROLE.TENANT) return { createdBy: userId };
  if (role === ROLE.TECHNICIAN) return { technicianId: userId };
  return {};
};

// ─── Service Methods ──────────────────────────────────────────────────────────

exports.registerComplaint = async (req, userId) => {
  const {
    title,
    concernedDepartments,
    daysFacingIssue,
    description,
    building,
  } = req.body;

  const uploadedFiles = await uploadService.uploadFiles(
    req,
    UPLOAD_TYPES.COMPLAINT,
  );

  const payload = {
    title,
    createdBy: userId,
    concernedDepartments,
    daysFacingIssue,
    description,
    building,
    image: uploadedFiles.savedFiles,
    complaintId: await getUniqueId(),
  };
  const complaint = await complaintRepository.createComplaint(payload);

  const populated = await complaintRepository.findComplaintByIdPopulated(
    complaint._id,
  );
  const formatted = formatComplaint(req, populated);

  process.nextTick(() =>
    notificationService.notify({
      title: `${formatted.createdBy?.name} (${formatted.createdBy?.tenantProfile?.companyName}) created a complaint: ${complaint.title}`,
      item: formatted,
      type: NOTIFICATION_TYPE.COMPLAINT_CREATED,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { role: ROLE.ADMIN },
      createdBy: userId,
    }),
  );

  return formatted;
};

exports.getComplaints = async (req) => {
  const { role, id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = buildRoleQuery(role, id);

  const [complaints, totalComplaints, statusCounts] = await Promise.all([
    complaintRepository.findComplaints(query, skip, limit),
    complaintRepository.countComplaints(query),
    complaintRepository.getStatusCounts(query),
  ]);

  return {
    complaints: complaints.map((c) => formatComplaint(req, c)),
    counts: buildStatusCounts(statusCounts),
    pagination: {
      total: totalComplaints,
      page,
      limit,
      totalPages: Math.ceil(totalComplaints / limit),
    },
  };
};

exports.getComplaintsByStatus = async (req) => {
  const { status } = req.params;
  const { role, id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Status-filtered query (for data fetch + count)
  const query = { complaintStatus: status, ...buildRoleQuery(role, id) };

  // Role-only query (for status counts across all statuses)
  const countQuery = buildRoleQuery(role, id);

  const [complaints, totalComplaints, statusCounts] = await Promise.all([
    complaintRepository.findComplaintsByStatus(query, skip, limit),
    complaintRepository.countComplaints(query),
    complaintRepository.getStatusCounts(countQuery), // all statuses, not filtered
  ]);

  return {
    complaints: complaints.map((c) => formatComplaint(req, c)),
    counts: buildStatusCounts(statusCounts),
    pagination: {
      total: totalComplaints,
      page,
      limit,
      totalPages: Math.ceil(totalComplaints / limit),
    },
  };
};

exports.getComplaintById = async (req) => {
  const { complaintId } = req.params;
  const { id: userId } = req.user;

  //Mark Notifications read of the complaint
  const notifications = await notificationRepository.markReadByModelId(
    complaintId,
    userId,
  );
  const unreadCount = await notificationRepository.countUnread(userId);

  const complaint =
    await complaintRepository.findComplaintByIdPopulated(complaintId);
  if (!complaint) return null;

  const formattedComplaint = formatComplaint(req, complaint);
  return { complaint: formattedComplaint, unreadCount };
};

exports.updateComplaintByAdmin = async (req, userId) => {
  const { complaintId } = req.params;
  const { complaintStatus, adminComment, severity } = req.body;

  const updateQuery = {};

  if (complaintStatus || severity) {
    updateQuery.$set = {};
    if (complaintStatus) {
      updateQuery.$set.complaintStatus = complaintStatus;
      if (complaintStatus === STATUS.RESOLVED)
        updateQuery.$set.resolvedAt = new Date();
      if (
        complaintStatus === STATUS.REOPENED ||
        complaintStatus === STATUS.PENDING
      )
        updateQuery.$set.resolvedAt = null;
    }
    if (severity) updateQuery.$set.severity = severity;
  }

  if (adminComment) updateQuery.$push = { adminComment };

  const complaint = await complaintRepository.updateComplaintById(
    complaintId,
    updateQuery,
  );
  if (!complaint) return null;

  const formatted = formatComplaint(req, complaint);

  // Build readable notification title
  let titleMessage = `Complaint Updated: ${complaint.title}`;
  if (complaintStatus && !severity && !adminComment)
    titleMessage = `Complaint Status updated to ${complaintStatus}`;
  else if (severity && !complaintStatus && !adminComment)
    titleMessage = `Complaint Severity updated to ${severity}`;
  else if (adminComment && !complaintStatus && !severity)
    titleMessage = `New admin comment on: ${complaint.title}`;

  process.nextTick(() =>
    notificationService.notify({
      title: titleMessage,
      item: formatted,
      type: NOTIFICATION_TYPE.COMPLAINT_UPDATED_BY_ADMIN,
      model: REFERENCE_MODEL.COMPLAINT,
      target: {
        userIds: [complaint.createdBy?._id, complaint.technicianId?._id].filter(
          Boolean,
        ),
      },
      createdBy: userId,
    }),
  );

  return { complaint: formatted, titleMessage };
};

exports.updateComplaintByUser = async (req, userId) => {
  const { complaintId } = req.params;
  const { userComment, reopen, ...updatedData } = req.body || {};

  const existing = await complaintRepository.findComplaintById(complaintId);
  if (!existing) return null;

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length) {
    if (existing.image?.length)
      await uploadService.deleteFiles(existing.image, UPLOAD_TYPES.COMPLAINT);

    const uploaded = await uploadService.saveFiles(
      files,
      UPLOAD_TYPES.COMPLAINT,
    );
    req.uploadedFiles = uploaded;
    updatedData.image = uploaded.savedFiles;
  }

  const updated = await complaintRepository.updateComplaintById(complaintId, {
    $set: updatedData,
  });
  const formatted = formatComplaint(req, updated);

  process.nextTick(() =>
    notificationService.notify({
      title: `Complaint updated by ${formatted.createdBy?.name} (${formatted.createdBy?.technicianProfile?.companyName}): ${updated.title}`,
      item: formatted,
      type: NOTIFICATION_TYPE.COMPLAINT_UPDATED_BY_USER,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { role: ROLE.ADMIN },
      createdBy: userId,
    }),
  );

  return formatted;
};

exports.assignTechnician = async (req, userId) => {
  const { complaintId, technicianId, reassignmentReason = "" } = req.body;

  const [complaint, technician] = await Promise.all([
    complaintRepository.findComplaintById(complaintId),
    complaintRepository.findTechnicianById(technicianId),
  ]);

  if (!complaint) return { error: "Complaint not found", status: 404 };
  if (!technician) return { error: "Technician not found", status: 404 };
  if (complaint.complaintStatus === STATUS.RESOLVED)
    return { error: "Resolved complaint cannot be assigned", status: 400 };

  // ─── Check if same technician is already active on this complaint ──────────
  if (complaint.technicianId?.toString() === technicianId)
    return {
      error: "Technician is already assigned to this complaint",
      status: 400,
    };

  // ─── Deactivate previous active assignment if exists ───────────────────────
  if (complaint.technicianId) {
    await complaintRepository.deactivateCurrentAssignment(complaintId);
  }

  // ─── Update complaint with new technicianId ───────────────────────────────
  const updated = await complaintRepository.updateComplaintById(complaintId, {
    $set: { technicianId },
  });

  // ─── Create new assignment record in AssignedComplaints collection ─────────
  const payload = {
    complaintId,
    technicianId,
    assignedBy: userId,
    isActive: true,
    reassignmentReason,
    assignedAt: new Date(),
  };
  await complaintRepository.createAssignment(payload);

  const formatted = formatComplaint(req, updated);

  // ─── Notify new technician
  process.nextTick(() =>
    notificationService.notify({
      title: complaint.title
        ? `A complaint has been assigned to you: ${complaint.title}`
        : "New complaint assigned",
      item: formatted,
      type: NOTIFICATION_TYPE.TECH_ASSIGNED,
      model: REFERENCE_MODEL.COMPLAINT,
      target: { userIds: [technicianId] },
      createdBy: userId,
    }),
  );

  return { complaint: formatted };
};

exports.updateTechnicianStatus = async (req, userId) => {
  const { complaintId, complaintStatus } = req.body;

  const technician = await complaintRepository.findTechnicianWithComplaint(
    userId,
    complaintId,
  );
  if (!technician)
    return { error: "This complaint is not assigned to you", status: 403 };

  const existing = await complaintRepository.findComplaintById(complaintId);
  if (!existing) return { error: "Complaint not found", status: 404 };
  // if (existing.status === STATUS.RESOLVED)
  //   return {
  //     error: "Complaint already resolved. Status cannot be updated",
  //     status: 400,
  //   };

  const updated = await complaintRepository.updateComplaintById(complaintId, {
    $set: { complaintStatus },
  });
  const formatted = formatComplaint(req, updated);

  process.nextTick(() =>
    notificationService.notify({
      title: `${formatted.technicianId?.name} (${formatted.technicianId?.technicianProfile?.designation}) marked complaint as ${complaintStatus}`,
      item: formatted,
      type: NOTIFICATION_TYPE.TECH_STATUS_UPDATED,
      model: REFERENCE_MODEL.COMPLAINT,
      target: {
        role: ROLE.ADMIN,
        userIds: [formatted.createdBy._id].filter(Boolean),
      },
      createdBy: userId,
    }),
  );

  return { complaint: formatted };
};

exports.deleteComplaint = async (complaintId) => {
  const complaint = await complaintRepository.findComplaintById(complaintId);
  if (!complaint) return false;

  if (complaint.image?.length)
    await uploadService.deleteFiles(complaint.image, UPLOAD_TYPES.COMPLAINT);

  await Promise.all([
    complaintRepository.deleteComplaintNotifications(complaint._id),
    complaintRepository.deleteComplaintById(complaintId),
  ]);

  return true;
};

// exports.handleReopenComplaint = async (complaint, reopen) => {
//   const isReopen = reopen === true || reopen === "true";
//   const isClose = reopen === false || reopen === "false";

//   // Invalid value
//   if (!isReopen && !isClose) {
//     throw new Error("Invalid value for reopen. Must be true or false");
//   }

//   /** ---------------- REOPEN ---------------- */
//   if (isReopen) {
//     // Complaint must be resolved before reopening
//     if (complaint.status !== STATUS.RESOLVED) {
//       throw new Error("Only resolved complaints can be reopened");
//     }

//     // Prevent multiple reopen actions
//     if (complaint.reopen) {
//       throw new Error("Complaint is already reopened");
//     }

//     const currentTime = new Date();
//     const resolvedTime = complaint.resolvedAt || complaint.updatedAt;
//     if (!resolvedTime || isNaN(new Date(resolvedTime).getTime())) {
//       throw new Error("Invalid resolved date");
//     }

//     const hoursElapsed =
//       (currentTime - new Date(resolvedTime)) / (1000 * 60 * 60);

//     // Allow reopen only within 24 hours
//     if (hoursElapsed > 24) {
//       throw new Error("Complaint can only be reopened within 24 hours");
//     }

//     // Reopen complaint
//     complaint.status = STATUS.REOPENED;
//     complaint.reopen = true;
//   }

//   /** ---------------- CLOSE AGAIN ---------------- */
//   if (isClose) {
//     if (!complaint.reopen) {
//       throw new Error("Complaint is not reopened");
//     }

//     //Close complaint
//     complaint.status = STATUS.CLOSED;
//     complaint.reopen = false;
//   }
//   return complaint;
// };
