const AssignedComplaint = require("../models/assignedComplaint.model");
const Complaint = require("../models/complaint.model");
const Notification = require("../models/notification.model");
const User = require("../models/user.model");

// ─── Reusable Populate Helper ─────────────────────────────────────────────────

const createdByPopulate = {
  path: "createdBy",
  select: "name email image tenantProfile",
  populate: {
    path: "tenantProfile",
    select: "companyName",
  },
};

const technicianPopulate = {
  path: "technicianId",
  select: "name email image technicianProfile",
  populate: {
    path: "technicianProfile",
    select: "designation",
    // select: "designation experience availabilityStatus",
  },
};

// ─── Complaint Queries ────────────────────────────────────────────────────────

exports.createComplaint = (payload) => Complaint.create(payload);

exports.findComplaintById = (id) => Complaint.findById(id); // raw, for mutation checks

exports.findComplaintByIdPopulated = (id) =>
  Complaint.findById(id)
    .populate(createdByPopulate)
    .populate(technicianPopulate)
    .lean();

exports.findComplaints = (query, skip, limit) =>
  Complaint.find(query)
    .populate(createdByPopulate)
    .populate(technicianPopulate)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

exports.countComplaints = (query) => Complaint.countDocuments(query);

exports.getStatusCounts = (query) =>
  Complaint.aggregate([
    { $match: query },
    { $group: { _id: "$complaintStatus", count: { $sum: 1 } } },
  ]);

exports.findComplaintsByStatus = (query, skip, limit) =>
  Complaint.find(query)
    .populate(createdByPopulate)
    .populate(technicianPopulate)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

exports.updateComplaintById = (id, updateQuery) =>
  Complaint.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  })
    .populate(createdByPopulate)
    .populate(technicianPopulate)
    .lean();

exports.deleteComplaintById = (id) => Complaint.findByIdAndDelete(id);

exports.deleteComplaintNotifications = (complaintId) =>
  Notification.deleteMany({
    referenceId: complaintId,
    referenceModel: "Complaint",
  });

// ─── Technician Queries ───────────────────────────────────────────────────────

exports.findTechnicianById = (id) => User.findById(id);

// Create a new assignment record
exports.createAssignment = (payload) => AssignedComplaint.create(payload);

// Get active assignment for a complaint
exports.findActiveAssignment = (complaintId) =>
  AssignedComplaint.findOne({ complaintId, isActive: true })
    .populate("technicianId", "name email image technicianProfile")
    .lean();

// Get full assignment history for a complaint
exports.findAssignmentHistory = (complaintId) =>
  AssignedComplaint.find({ complaintId })
    .populate("technicianId", "name email image")
    .populate("assignedBy", "name email")
    .sort({ assignedAt: -1 })
    .lean();

// Deactivate current active assignment (on reassignment)
exports.deactivateCurrentAssignment = (complaintId) =>
  AssignedComplaint.findOneAndUpdate(
    { complaintId, isActive: true },
    {
      $set: {
        isActive: false,
        completedAt: new Date(),
      },
    },
    { new: true },
  );

// Get all active complaints for a technician
exports.findActiveComplaintsByTechnician = (technicianId) =>
  AssignedComplaint.find({ technicianId, isActive: true })
    .populate({
      path: "complaintId",
      populate: { path: "createdBy", select: "name email image tenantProfile",
        populate: { path: "tenantProfile", select: "companyName" }
      },
    })
    .sort({ assignedAt: -1 })
    .lean();

// Get all complaints for a technician (history)
exports.findAllComplaintsByTechnician = (technicianId) =>
  AssignedComplaint.find({ technicianId })
    .populate({
      path: "complaintId",
      populate: { path: "createdBy", select: "name email image tenantProfile",
        populate: { path: "tenantProfile", select: "companyName" }
      },
    })
    .sort({ assignedAt: -1 })
    .lean();

// Update assignment status (technician updates progress)
exports.updateAssignmentStatus = (complaintId, technicianId, updateData) =>
  AssignedComplaint.findOneAndUpdate(
    { complaintId, technicianId, isActive: true },
    { $set: updateData },
    { new: true },
  );

exports.findTechnicianWithComplaint = (technicianId, complaintId) =>
  AssignedComplaint.findOne({ technicianId, complaintId, isActive: true }).lean();