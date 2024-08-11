const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middlewares/userauthentication");

const {
  signup,
  signin,
  getuser,
  verifyemail,
  forgotpassword,
  resetpassword,
  kycverification,
  messaged,
  withdrawal,
  deposit,
  getwithdrawal,
  getdeposit,
  updatepassword,
  updateuser,
  resendconfimationmail,
  sendmessage,
  getallmessage,
  getmessage,
  deletemessage,
  getallreceivedmessage,
  getreceivedmessage,
  transfer,
  gettransfer,
  getreferrals,
  getreferralnames,
  verifyOtpCode,
} = require("../controllers/auth");

const isResetTokenValid = require("../middlewares/isResetTokenValid");
const cloudinaryupload = require("../middlewares/cloudinaryuploads");

const uploader = require("../middlewares/multer");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/resend-confirmation-email", resendconfimationmail);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password", isResetTokenValid, resetpassword);

router.post("/withdrawal-verification", verifyUserToken, verifyOtpCode);
router.post(
  "/kyc-verification",
  verifyUserToken,
  uploader.fields([{ name: "image1" }, { name: "image2" }]),
  cloudinaryupload,
  kycverification
);
router.post("/send-message", verifyUserToken, sendmessage);
router.post("/update-password", verifyUserToken, updatepassword);
router.post("/messages", messaged);
router.get("/verify-token", isResetTokenValid, (req, res) => {
  res.json({ success: true, msg: "Token is valid" });
});
router.get(
  "/received-messages/:ownerID",
  verifyUserToken,
  getallreceivedmessage
);
router.get("/received-message/:messageID", verifyUserToken, getreceivedmessage);
router.post("/deposit/:userID", verifyUserToken, deposit);
router.post("/withdrawal/:userID", verifyUserToken, withdrawal);
router.get("/:userID", verifyUserToken, getuser);
router.get("/deposit/:userID", verifyUserToken, getdeposit);
router.get("/withdrawals/:userID", verifyUserToken, getwithdrawal);
router.get("/sent-message/:messageID", verifyUserToken, getmessage);
router.get("/sent-messages/:ownerID", verifyUserToken, getallmessage);
router.post("/transfer/:userID", verifyUserToken, transfer);
router.get("/transfers/:userID", verifyUserToken, gettransfer);
router.patch("/update", verifyUserToken, uploader.single("image"), updateuser);
router.delete("/send-message/:messageID", verifyUserToken, deletemessage);
router.get("/referrals/:userID", verifyUserToken, getreferrals);
router.get("/referral-names/:userID", verifyUserToken, getreferralnames);
router.get("/verify/:userID/:emailToken", verifyemail);

module.exports = router;
