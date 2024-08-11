const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const verifyUserToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(StatusCodes.FORBIDDEN).json({ msg: "Token Invalid!" });
    return
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userID: payload.userID,
      fistname: payload.firstname,
      lastname: payload.lastname,
    };
    next();
  } catch (error) {
    res.status(StatusCodes.FORBIDDEN).json({ msg: "Authentication invalid" });
  }
};

module.exports = {
  verifyUserToken,
};
