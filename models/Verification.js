const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documenttype: {
      type: String,
      required: [true, "Please select document type"],
    },
    fullname: {
      type: String,
      required: [true, "Please provide your name as it is on document"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email address"],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid Email",
      ],
      unique: true,
      lowercase: true,
    },
    documentnumber: {
      type: String,
      required: [true, "Please upload document"],
    },
    country: {
      type: String,
      required: [true, "Please select document issuing country"],
    },
    region: {
      type: String,
      required: [true, "Please select region or state"],
    },
    address: {
      type: String,
      required: [true, "Please enter your address"],
    },
    dob: {
      type: Date,
      required: [true, "Please provide your date of birth"],
    },
    image: [],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Verification", VerificationSchema);
