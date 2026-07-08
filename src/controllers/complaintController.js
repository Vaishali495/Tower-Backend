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

const complaintService = require("../services/complaint.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Register a New Complaint
 * @description Create and submit a new complaint on behalf of the authenticated user.
 * @route POST /api/complaint
 * @access Private
 */
exports.registerComplaint = async (req, res) => {
  const { id: userId } = req.user;
  const complaint = await complaintService.registerComplaint(req, userId);

  return successResponse(
    res,
    "Complaint registered successfully",
    "",
    complaint,
    201,
  );
};

/**
 * Get All Registered Complaints
 * @description Fetch a paginated list of all complaints. Results vary by role —
 *              admins see all complaints, tenants see only their own.
 * @route GET /api/complaint
 * @access Private
 */
exports.getRegisteredComplaints = async (req, res) => {
  const data = await complaintService.getComplaints(req);

  return successResponse(
    res,
    data.complaints.length
      ? "Complaints fetched successfully"
      : "No complaints found",
    "",
    data,
    201,
  );
};

/**
 * Get Complaints by Status
 * @description Fetch a paginated list of complaints filtered by a given status
 *              (e.g. open, in-progress, resolved, closed).
 * @route GET /api/complaint/status/:status
 * @access Private
 */
exports.getComplaintsByStatus = async (req, res) => {
  const data = await complaintService.getComplaintsByStatus(req);

  return successResponse(
    res,
    data.complaints.length
      ? "Complaints fetched successfully"
      : "No complaints found",
    "",
    data,
    201,
  );
};

/**
 * Get Complaint by ID
 * @description Fetch the full details of a single complaint by its ID.
 * @route GET /api/complaint/:complaintId
 * @access Private
 */
exports.getComplaintById = async (req, res) => {
  const data = await complaintService.getComplaintById(req);
  if (!data.complaint)
    return errorResponse(res, "Complaint not found.", "error", "", 400);

  return successResponse(res, "Complaint fetched successfully", "", data, 200);
};

/**
 * Update Complaint by Admin
 * @description Allow an admin to update administrative fields on a complaint.
 *
 * Updatable fields:
 * - status
 * - severity
 * - admin comments
 *
 * @route PUT /api/complaint/admin/:complaintId
 * @access Private (Admin)
 */
exports.updateComplaintByAdmin = async (req, res) => {
  const { id: userId } = req.user;
  const result = await complaintService.updateComplaintByAdmin(req, userId);

  if (!result)
    return errorResponse(res, "Complaint not found.", "error", "", 400);

  return successResponse(res, result.titleMessage, "", result.complaint, 200);
};

/**
 * Update Complaint by User
 * @description Allow the complaint owner (tenant) to update their own complaint.
 *
 * Updatable fields:
 * - complaint details
 * - images
 *
 * @route PUT /api/complaint/:complaintId
 * @access Private (Tenant)
 */
exports.updateComplaintByUser = async (req, res) => {
  const { id: userId } = req.user;
  const complaint = await complaintService.updateComplaintByUser(req, userId);

  if (!complaint)
    return errorResponse(res, "Complaint not found.", "error", "", 400);

  return successResponse(
    res,
    "Complaint updated successfully",
    "",
    complaint,
    200,
  );
};

/**
 * Send Complaint Message
 * @description Send a message (optionally threaded) on a complaint.
 *              Media attachment support is pending implementation.
 * @route POST /api/complaint/message
 * @access Private
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
 * Assign Technician to Complaint
 * @description Assign a technician to handle a specific complaint.
 *              Creates an assignment record and notifies the technician.
 * @route PATCH /api/complaint/assign-technician
 * @access Private (Admin)
 */
exports.assignTechnician = async (req, res) => {
  const { id: userId } = req.user;
  const result = await complaintService.assignTechnician(req, userId);

  if (result.error)
    return errorResponse(res, result.error, "error", "", result.status);

  return successResponse(
    res,
    "Technician assigned successfully",
    "",
    result.complaint,
    200,
  );
};

/**
 * Update Technician Status
 * @description Allow an assigned technician to update the progress status
 *              of a complaint (e.g. in-progress, resolved).
 * @route PATCH /api/complaint/technician-status
 * @access Private (Technician)
 */
exports.updateTechnicianStatus = async (req, res) => {
  const { id: userId } = req.user;
  const result = await complaintService.updateTechnicianStatus(req, userId);

  if (result.error)
    return errorResponse(res, result.error, "error", "", result.status);

  return successResponse(
    res,
    "Complaint status updated successfully",
    "",
    result.complaint,
    200,
  );
};

/**
 * Delete Complaint
 * @description Permanently delete a complaint by its ID.
 * @route DELETE /api/complaint/:complaintId
 * @access Private (Admin)
 */
exports.deleteComplaint = async (req, res) => {
  const { complaintId } = req.params;
  const deleted = await complaintService.deleteComplaint(complaintId);

  if (!deleted)
    return errorResponse(res, "Complaint not found.", "error", "", 400);

  return successResponse(res, "Complaint deleted successfully", "", 200);
};
