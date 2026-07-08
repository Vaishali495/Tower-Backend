const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const complaintMessageSchema = new Schema(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parentId: {
      type: Schema.Types.ObjectId,     //Previous message Id
      ref: "complaintMessage",
      default: null,
    },

    message: {
      type: String,
      trim: true,
    },

    media: [
      {
        type: String, // file URL
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("complaintMessage", complaintMessageSchema);
