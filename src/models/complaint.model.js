const { string } = require("joi");
const mongoose = require("mongoose");
const { SEVERITY, DEPARTMENTS, STATUS } = require("../constants/enums");
const Schema = mongoose.Schema;

const complaintSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    technicianId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, default: "" },
    image: {
      type: [String],
      default: [],
    },
    concernedDepartments: [{ type: String }],
    daysFacingIssue: { type: String, default: "" },
    building: { type: String, default: "" },
    // floor: { type: String, default: "" },
    // companyName: { type: String, default: "" },
    description: { type: String, default: "" },
    adminComment: [{ type: String, default: "" }],
    // userComment: [{ type: String, default: "" }],
    complaintId: { type: String, default: null },
    complaintStatus: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.PENDING,
    },
    // technicianStatus: {
    //   type: String,
    //   enum: Object.values(STATUS),
    //   default: STATUS.PENDING,
    //   // default: null,
    // },
    severity: {
      type: String,
      enum: Object.values(SEVERITY),
      default: SEVERITY.LOW,
    },
    reopen: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Complaint", complaintSchema, "complaints");
