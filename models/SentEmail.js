const mongoose = require("mongoose");

const SentEmailSchema =  new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    from: {
      type: String,
      required: [true, "Please enter your email"],
    },
    to: {
      type: String,
      required: [true, "Please enter your email"],
    },
    subject: {
      type: String,
      required: [true, "Please enter your subject"],
    },
    message: {
      type: String,
      required: [true, "Please enter your message"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SentEmail", SentEmailSchema);
