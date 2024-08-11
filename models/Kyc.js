const mongoose = require("mongoose");

const KycSchema = new mongoose.Schema(
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
  
    image: [],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kyc", KycSchema);
