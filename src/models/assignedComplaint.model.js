const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { STATUS, SEVERITY } = require("../constants/enums");

const complaintAssignmentSchema = new Schema(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
    technicianId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // status: { type: String, enum: Object.values(STATUS),default: STATUS.PENDING },
    isActive: { type: Boolean, default: true },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // priority: {
    //   type: String,
    //   enum: Object.values(SEVERITY),
    //   default: "MEDIUM",
    // },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "AssignedComplaints",
  complaintAssignmentSchema,
  "assignedComplaints",
);
