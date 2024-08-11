const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(StatusCodes.FORBIDDEN).json({msg:"Token Invalid!"});
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
    res.status(StatusCodes.FORBIDDEN).json({msg: "Authentication invalid"});
  }
};
const verifyTokenAndAdmin = async (req, res, next) => {
  await verifyToken(req, res, () => {
    try {
      if (req.user) {
        next();
      } else {
        res.status(StatusCodes.FORBIDDEN).json({msg:"You are not authorized!"});
      }
    } catch (error) {
      console.log(error);
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAdmin,
};
