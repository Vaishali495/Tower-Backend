const mongoose = require("mongoose");
const { ROLE, ASSIGNED_COMPLAINT_STATUS } = require("../constants/enums");
const Schema = mongoose.Schema;

/************************ Base Schema ********************** */

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, default: null },
    role: { type: String, enum: Object.values(ROLE), default: "" }, //Admin, User, Technician
    fcmToken: [{ type: String, default: "" }],
    name: { type: String, default: "" },
    mobileNumber: { type: String, unique: true, default: "" },
    image: { type: String, default: null },
    tenantProfile: {
      type: Schema.Types.ObjectId,
      ref: "TenantProfile",
      default: null,
    },
    technicianProfile: {
      type: Schema.Types.ObjectId,
      ref: "TechnicianProfile",
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true }); //Indexing

module.exports = mongoose.model("User", userSchema, "users");
