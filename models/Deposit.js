const mongoose = require("mongoose");
const shortid = require("shortid");

const DepositSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
    },
    plan: {
      type: String,
      required: [true, "Please select investment plan"],
    },
    coin: {
      type: String,
      required: [true, "Please select coin type"],
    },
    amount: {
      type: String,
      required: [true, "Please enter amount"],
    },
    reference: {
      type: String,
      default: shortid.generate,
    },
    maturitytime: {
      type: String,
    },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deposit", DepositSchema);
