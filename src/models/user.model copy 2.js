const mongoose = require("mongoose");
const { ROLE, ASSIGNED_COMPLAINT_STATUS } = require("../constants/enums");
const Schema = mongoose.Schema;

/************************ Base Schema ********************** */

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, default: null },
    role: { type: String, default: "" },

    // Common optional fields
    fcmToken: [{ type: String, default: "" }],
    name: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    // image: {
    //   url: { type: String, default: "" },
    // },
    image: { type: String, default: null },
  },
  { timestamps: true, discriminatorKey: "role" },
);

/************************ MAIN MODEL ********************** */
userSchema.index({ email: 1 }, { unique: true }); //Indexing
const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);

/************************ TENANT SCHEMA ********************** */

const tenantSchema = new Schema({
  floor: { type: String, default: "" },
  companyName: { type: String, default: "" },
  building: { type: String, default: 1 },
});

/************************ TECHNICIAN SCHEMA ********************** */

const technicianSchema = new Schema({
  designation: { type: String, default: "" },
  experience: { type: Number, default: 0 },
  availabilityStatus: { type: String, default: "" },
  // assignedComplaints: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     ref: "Complaint",
  //   },
  // ],
  assignedComplaints: [
    {
      complaintId: {
        type: Schema.Types.ObjectId,
        ref: "Complaint",
        required: true,
      },

      status: {
        type: String,
      },

      assignedAt: {
        type: Date,
        default: Date.now,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
  ],
});

/************************ ADMIN SCHEMA ********************** */

const adminSchema = new Schema({});

/************************ DISCRIMINATORS ********************** */

const Tenant = User.discriminator(ROLE.TENANT, tenantSchema);

const Technician = User.discriminator(ROLE.TECHNICIAN, technicianSchema);

const Admin = User.discriminator(ROLE.ADMIN, adminSchema);

/************************ EXPORTS ********************** */

module.exports = {
  User,
  Tenant,
  Technician,
  Admin,
};
