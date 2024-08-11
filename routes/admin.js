const express = require("express");
const router = express.Router();

const { verifyTokenAndAdmin } = require("../middlewares/authentication");
const {
  adminsignup,
  adminlogin,
  adminGetAllUsers,
  adminGetUser,
  adminDeleteUser,
  adminUpdateUser,
  adminGetMessages,
  adminGetAllDeposits,
  adminGetAllWithdrawals,
  adminSendMail,
  adminGetSentEmails,
  adminGetWithdrawals,
  adminGetWithdrawal,
  adminGetDeposits,
  adminGetDeposit,
  adminUpdateWithdrawal,
  adminDeleteWithdrawal,
  adminUpdateDeposit,
  adminDeleteDeposit,
  adminGetVerificationInfo,
  adminGetTransfer,
  adminUpdateTransfer,
  adminGetTransfers,
  adminDeleteTransfer,
  adminGetUserReferrals,
  adminGetUserReferralNames,
  getAllMessages,
  getAllUsermessages,
  deletemessage,
  getAllUserSentMessages,
  deleteReceivedMessage,
  adminGetAllTransfers,
  adminSendOtpCode,
  adminGetOtpCode,
  adminGetOneKyc,
  adminGetAllKyc
} = require("../controllers/admin");
router.post("/signup", adminsignup);
router.post("/signin", adminlogin);
router.post("/withdrawal-verification", verifyTokenAndAdmin, adminSendOtpCode);
router.post("/send-mail", verifyTokenAndAdmin, adminSendMail);
router.get("/messages", verifyTokenAndAdmin, adminGetMessages);
router.get("/deposits", verifyTokenAndAdmin, adminGetAllDeposits);
router.get("/all-withdrawals", verifyTokenAndAdmin, adminGetAllWithdrawals);
router.get("/transfers", verifyTokenAndAdmin, adminGetAllTransfers);
router.get("/send-mail", verifyTokenAndAdmin, adminGetSentEmails);
router.get("/user-messages", verifyTokenAndAdmin, getAllMessages);
router.get("/kyc-verification", verifyTokenAndAdmin, adminGetAllKyc)
router.get(
  "/user-sent-messages/:id",
  verifyTokenAndAdmin,
  getAllUserSentMessages
);
router.get("/user-messages/:id", verifyTokenAndAdmin, getAllUsermessages);
router.get("/", verifyTokenAndAdmin, adminGetAllUsers);
router.get("/withdrawals/:id", verifyTokenAndAdmin, adminGetWithdrawals);
router.get("/transfers/:id", verifyTokenAndAdmin, adminGetTransfers);
router.get("/withdrawal/:id", verifyTokenAndAdmin, adminGetWithdrawal);
router.get(
  "/withdrawal-verification/:id",
  verifyTokenAndAdmin,
  adminGetOtpCode
);

router.get("/transfer/:id", verifyTokenAndAdmin, adminGetTransfer);
router.get("/deposits/:id", verifyTokenAndAdmin, adminGetDeposits);
router.get("/deposit/:id", verifyTokenAndAdmin, adminGetDeposit);
router.get("/:id", verifyTokenAndAdmin, adminGetUser);
router.get("/referrals/:id", verifyTokenAndAdmin, adminGetUserReferrals);
router.get(
  "/referral-names/:id",
  verifyTokenAndAdmin,
  adminGetUserReferralNames
);
router.get("/kyc-verification/:id", verifyTokenAndAdmin, adminGetOneKyc)
router.delete("/:id", verifyTokenAndAdmin, adminDeleteUser);
router.patch("/:id", verifyTokenAndAdmin, adminUpdateUser);
router.get(
  "/user-verification/:id",
  verifyTokenAndAdmin,
  adminGetVerificationInfo
);
router.delete("/user-messages/:messageID", verifyTokenAndAdmin, deletemessage);
router.delete(
  "/user-received-messages/:messageID",
  verifyTokenAndAdmin,
  deleteReceivedMessage
);
router.delete("/withdrawal/:id", verifyTokenAndAdmin, adminDeleteWithdrawal);
router.patch("/withdrawal/:id", verifyTokenAndAdmin, adminUpdateWithdrawal);
router.delete("/deposits/:id", verifyTokenAndAdmin, adminDeleteDeposit);
router.patch("/deposits/:id", verifyTokenAndAdmin, adminUpdateDeposit);
router.delete("/transfer/:id", verifyTokenAndAdmin, adminDeleteTransfer);
router.patch("/transfer/:id", verifyTokenAndAdmin, adminUpdateTransfer);

module.exports = router;
