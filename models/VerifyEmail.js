const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const VerificationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: "60m",
    default: Date.now(),
  },
});

VerificationSchema.pre("save", async function (next) {
  if (!this.isModified("token")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.token = await bcrypt.hash(this.token, salt);
  next();
});

VerificationSchema.methods.compareToken = async function (token) {
  const isMatch = await bcrypt.compare(token, this.token);
  return isMatch;
};

module.exports = mongoose.model("VerificationToken", VerificationSchema);
