const User = require("../models/User");
const ResetToken = require("../models/ResetPassword");
const { isValidObjectId } = require("mongoose");
const { BadRequestError } = require("../errors");

const isResetTokenValid = async(req, res, next) => {
  const { token, id } = req.query;
  if ((!token, !id)) {
    throw new BadRequestError("Invalid Request!");
  }
  if (!isValidObjectId(id)) {
    throw new BadRequestError("Invalid User!");
  }
  const user = await User.findById(id);
  if (!user) {
    throw new BadRequestError("User not found!");
  }
  const resetToken = await ResetToken.findOne({ owner: user._id });
  if (!resetToken) {
    throw new BadRequestError("Reset token not found!");
  }
  const isValid = await resetToken.compareToken(token);
  if (!isValid) {
    throw new BadRequestError("Reset token is invalid!");
  }
  req.user = user;
  next();
};

module.exports = isResetTokenValid;
