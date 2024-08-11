const mongoose = require("mongoose");
const shortid = require("shortid");

const WithdrawalSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
    },
    type: {
      type: String,

    },
    coin: {
      type: String,
     
    },
    amount: {
      type: String,
      required: [true, "Enter withdrawal amount"],
    },
    walletAddress: {
      type: String,
     
    },
    details: {
      type: String,
     
    },
    comment: {
      type: String,
    },
    reference: {
      type: String,
      default: shortid.generate,
    },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
