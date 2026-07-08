const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const technicianProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", default: null },
  designation: { type: String, default: "" },
  experience: { type: Number, default: 0 },
  availabilityStatus: { type: String, default: "" },
});

module.exports = mongoose.model(
  "TechnicianProfile",
  technicianProfileSchema,
  "technicians",
);
