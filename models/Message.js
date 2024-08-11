const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const MessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
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

module.exports = mongoose.model("Message", MessageSchema);
