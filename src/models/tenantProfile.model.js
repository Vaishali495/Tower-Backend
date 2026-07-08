const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tenantProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", default: null },
  floor: { type: String, default: "" },
  companyName: { type: String, defaut: "" },
  building: { type: String, default: 1 },
});

module.exports = mongoose.model(
  "TenantProfile",
  tenantProfileSchema,
  "tenants",
);
