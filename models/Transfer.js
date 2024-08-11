const mongoose = require("mongoose");
const shortid = require("shortid");

const TransferSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
    },
    coin: {
      type: String,
      required: [true, "Select coin type"],
    },
    amount: {
      type: String,
      required: [true, "Enter amount to send"],
    },
    walletAddress: {
      type: String,
      required: [true, "Enter the wallet address you are sending to"],
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

module.exports = mongoose.model("Transfer", TransferSchema);
