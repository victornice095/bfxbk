const mongoose = require("mongoose");

const DepositListSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
    },
    info: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DepositList", DepositListSchema);
