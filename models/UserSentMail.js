const mongoose = require("mongoose");
const shortid = require("shortid");

const UserSentMailSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email: {
      type: String,
    },
    title: {
      type: String,
      required: [true, "Please enter your name"],
    },
    message: {
      type: String,
      required: [true, "Please enter your message"],
    },
    messageid: {
      type: String,
      default: shortid.generate,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSentMail", UserSentMailSchema);
