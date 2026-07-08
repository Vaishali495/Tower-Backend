const router = require("express").Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createComplaintSchema,
  complaintIdParamSchema,
  adminUpdateComplaintSchema,
  userUpdateComplaintSchema,
  complaintMessageSchema,
  assignTechnicianSchema,
  technicianStatusSchema,
  complaintStatusSchema,
} = require("../validations/complaint.validation");
const { validateFiles, uploadMiddleware } = require("../middleware/fileFilter");
const { asyncHandler } = require("../middleware/error.middleware");
const complaintController = require("../controllers/complaintController");
const {
  isAdmin,
  isTenant,
  isTechnician,
} = require("../middleware/roleMiddleware");

/**
 * =============================================================================
 * Complaint Routes
 * =============================================================================
 */

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaint management endpoints
 */

router.post(
  "/",
  auth,
  isTenant,
  uploadMiddleware.any(),
  validate(createComplaintSchema),
  validateFiles({ required: false }),
  asyncHandler(complaintController.registerComplaint),
);

router.put(
  "/admin/:complaintId",
  auth,
  isAdmin,
  validate(complaintIdParamSchema, "params"),
  validate(adminUpdateComplaintSchema),
  asyncHandler(complaintController.updateComplaintByAdmin),
);

router.put(
  "/:complaintId",
  auth,
  isTenant,
  validate(complaintIdParamSchema, "params"),
  uploadMiddleware.any(),
  validate(userUpdateComplaintSchema),
  validateFiles({ required: false }),
  asyncHandler(complaintController.updateComplaintByUser),
);

router.get(
  "/",
  auth,
  asyncHandler(complaintController.getRegisteredComplaints),
);

router.get(
  "/:complaintId",
  auth,
  asyncHandler(complaintController.getComplaintById),
);

router.get(
  "/status/:status",
  auth,
  validate(complaintStatusSchema, "params"),
  asyncHandler(complaintController.getComplaintsByStatus),
);

router.patch(
  "/assign-technician",
  auth,
  isAdmin,
  validate(assignTechnicianSchema),
  asyncHandler(complaintController.assignTechnician),
);

router.patch(
  "/technician-status",
  auth,
  isTechnician,
  validate(technicianStatusSchema),
  asyncHandler(complaintController.updateTechnicianStatus),
);

router.delete(
  "/:complaintId",
  auth,
  // isTenant,
  validate(complaintIdParamSchema, "params"),
  asyncHandler(complaintController.deleteComplaint),
);

// router.post(
//   "/message",
//   auth,
//   multer().any(),
//   validate(complaintMessageSchema),
//   validateFiles,
//   asyncHandler(complaintController.sendComplaintMessage),
// );

module.exports = router;
