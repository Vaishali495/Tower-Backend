const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    description: { type: String, default: "" },
    postedBy: { type: Schema.Types.ObjectId, ref: "User" },
    image: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Post", postSchema, "posts");
