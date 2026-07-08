const mongoose = require("mongoose");
const { ROLE } = require("../constants/enums");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.TENANT,
    },

    // Common optional fields
    fcmToken: [{ type: String, default: "" }],
    name: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    // image: { type: String, default: "" },
    image: {
      url: { type: String, default: "" },
    },

    // User-specific fields
    floor: { type: String, default: "G" },
    companyName: { type: String, default: "" },
    building: { type: String, default: 1 },

    //Technician  specific fields
    designation: { type: String },
    experience: { type: Number, default: 0 },
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
    },
    assignedComplaints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
