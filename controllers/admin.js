const User = require("../models/User");
const Admin = require("../models/Admin");
const Message = require("../models/Message");
const Withdrawal = require("../models/Withdrawal");
const Deposit = require("../models/Deposit");
const Verification = require("../models/Verification");
const Kyc = require("../models/Kyc");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const UserSentMail = require("../models/UserSentMail");
const SentEmail = require("../models/SentEmail");
const OtpCode = require("../models/OtpCode");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
const { sendEmailTemplate } = require("../templates/email");
const { sendOtpCodeTemplate } = require("../templates/sendOtpCode");
const Transfer = require("../models/Transfer");
const lodash = require("lodash");

const Lists = require("../models/Lists");

const mailgunAuth = {
  auth: {
    api_key: process.env.MAIL_KEY,
    domain: process.env.MAIL_DOMAIN,
  },
};

const adminsignup = async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;
  const user = await Admin.findOne({ email });
  if (user) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "User with this email already exist" });
  }
  const usern = await Admin.findOne({ username });
  if (usern) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Username already exist!" });
  }
  const newUser = new Admin({
    firstname,
    lastname,
    email,
    username,
    password,
  });
  const token = newUser.createJWT();
  await newUser.save();
  res.status(StatusCodes.CREATED).json({
    token,
    msg: "Registration Successful",
  });
};

const adminlogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }
  const user = await Admin.findOne({ email }).select("+password");
  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials suplied");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid email/password combination");
  }
  const isAdmin = await user.isAdmin;
  if (!isAdmin) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "You are not authorized to visit this route!",
    });
  }
  const token = user.createJWT();
  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      isAdmin: user.isAdmin,
      username: user.username,
    },
    token,
    msg: "You have successfully login",
  });
};

const adminGetAllUsers = async (req, res) => {
  const query = req.query.tag;
  try {
    const users = query
      ? await User.find({
          $or: [
            { email: query },
            { firstname: query },
            { lastname: query },
            { username: query },
          ],
        }).sort({ createdAt: -1 })
      : await User.find().sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json(error);
  }
};

const adminGetUser = async (req, res) => {
  const {
    params: { id: _id },
  } = req;
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    } else {
      const { password, ...others } = user._doc;
      res.status(StatusCodes.OK).json(others);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete({ _id: req.params.id });
    if (!user) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: `User with id ${req.params.id} was not found` });
    } else {
      res.status(StatusCodes.OK).json({ msg: "User has been deleted..." });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminUpdateUser = async (req, res) => {
  const {
    body: {
      referralEarnings,
      withdrawnbalance,
      transferredbalance,
      withdrawalactive,
      active,
      verified,
      status,
      BTC,
      ETH,
      USDT,
      BNB,
      LTC,
      TRX,
    },
    params: { id: _id },
  } = req;

  if (
    referralEarnings === "" ||
    verified === "" ||
    active === "" ||
    withdrawnbalance === "" ||
    transferredbalance === "" ||
    withdrawalactive === "" ||
    status === "" ||
    BTC === "" ||
    ETH === "" ||
    USDT === "" ||
    BNB === "" ||
    LTC === "" ||
    TRX === ""
  ) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "You can't send an empty field" });
  } else {
    const user = await User.findByIdAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: false,
        runValidators: true,
      }
    );

    if (BTC || ETH || USDT || BNB || LTC || TRX) {
      const usern = await User.findById({ _id: req.params.id });

      const newList = new Lists({
        owner: usern._id,
        email: usern.email,
        info: BTC || ETH || USDT || BNB || LTC || TRX,
      });
      await newList.save();
    }
    if (!user) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "User update failed" });
    } else {
      res.status(StatusCodes.OK).json({ user });
    }
  }
};

const adminGetMessages = async (req, res) => {
  const query = req.query.new;
  try {
    const messages = query
      ? await Message.find().sort({ createdAt: -1 })
      : await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json(error);
  }
};

const adminGetAllDeposits = async (req, res) => {
  const query = req.query.tag;
  try {
    const deposits = query
      ? await Deposit.find().sort({ createdAt: -1 })
      : await Deposit.find().sort({ createdAt: -1 });
    res.status(200).json(deposits);
  } catch (error) {
    res.status(500).json(error);
  }
};

const adminGetAllTransfers = async (req, res) => {
  const query = req.query.new;
  try {
    const transfers = query
      ? await Transfer.find().sort({ createdAt: -1 })
      : await Transfer.find().sort({ createdAt: -1 });
    res.status(200).json(transfers);
  } catch (error) {
    res.status(500).json(error);
  }
};

const adminGetAllWithdrawals = async (req, res) => {
  const query = req.query.new;
  try {
    const withdrawals = query
      ? await Withdrawal.find().sort({ createdAt: -1 })
      : await Withdrawal.find().sort({ createdAt: -1 });
    res.status(200).json(withdrawals);
  } catch (error) {
    res.status(500).json(error);
  }
};

const adminSendMail = async (req, res) => {
  const { from, to, subject, message } = req.body;

  const user = await User.findOne({ to });
  if (user) {
    const sendMail = new SentEmail({
      owner: user._id,
      from,
      to,
      subject,
      message,
    });

    await sendMail.save();
    res.status(StatusCodes.CREATED).json({
      user: {
        from: sendMail.from,
        to: sendMail.to,
        subject: sendMail.subject,
        message: sendMail.message,
      },
      msg: "Email Sent Successfully",
    });
    return;
  } else {
    const sendMail = new SentEmail({
      from,
      to,
      subject,
      message,
    });

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const mailOptions = {
      from: sendMail.from,
      to: sendMail.to,
      subject: sendMail.subject,
      html: sendEmailTemplate(sendMail.message, sendMail.from),
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent successfully.");
      }
    });

    await sendMail.save();
    res.status(StatusCodes.CREATED).json({
      user: {
        from: sendMail.from,
        to: sendMail.to,
        subject: sendMail.subject,
        message: sendMail.message,
      },
      msg: "Email Sent Successfully",
    });
    return;
  }
};

const adminGetSentEmails = async (req, res) => {
  const query = req.query.new;
  try {
    const sentEmails = query
      ? await SentEmail.find().sort({ createdAt: -1 })
      : await SentEmail.find().sort({ createdAt: -1 });
    res.StatusCodes(200).json(sentEmails);
  } catch (error) {
    res.StatusCodes(500).json(error);
  }
};

const adminGetDeposits = async (req, res) => {
  const id = req.params.id;
  try {
    const deposit = await Deposit.find({ owner: id }).sort({
      createdAt: -1,
    });
    if (!deposit) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Deposit records not foundt" });
    } else {
      res.status(StatusCodes.OK).json(deposit);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetDeposit = async (req, res) => {
  const id = req.params.id;
  try {
    const deposit = await Deposit.find({ _id: id });
    if (!deposit) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "You have not made any deposit yet" });
    } else {
      res.status(StatusCodes.OK).json(deposit);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetWithdrawals = async (req, res) => {
  const id = req.params.id;
  try {
    const withdrawal = await Withdrawal.find({ owner: id }).sort({
      createdAt: -1,
    });
    if (!withdrawal) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Withrawal records not foundt" });
    } else {
      res.status(StatusCodes.OK).json(withdrawal);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetWithdrawal = async (req, res) => {
  const id = req.params.id;
  try {
    const withdrawal = await Withdrawal.findOne({ _id: id });

    if (!withdrawal) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Withdrawal record doesn't exist" });
    } else {
      res.status(StatusCodes.OK).json(withdrawal);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminUpdateWithdrawal = async (req, res) => {
  const { coin, amount, status, walletAddress } = req.body;

  if (coin === "" || amount === "" || status === "" || walletAddress === "") {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "You can't send an empty field" });
  } else {
    const withdrawalToUpdate = await Withdrawal.findOne({
      _id: req.params.id,
    });
    if (!withdrawalToUpdate) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Withdrawal Records Not Found" });
    } else {
      const withdrawal = await Withdrawal.findByIdAndUpdate(
        { _id: withdrawalToUpdate._id },
        req.body,
        {
          new: false,
          runValidators: true,
        }
      );
      if (!withdrawal) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ msg: "User update failed" });
      } else {
        res.status(StatusCodes.OK).json({ withdrawal });
      }
    }
  }
};

const adminDeleteWithdrawal = async (req, res) => {
  const id = req.params.id;

  try {
    const withdrawalToDelete = await Withdrawal.findOne({
      _id: req.params.id,
    });
    if (!withdrawalToDelete) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Withdrawal Records Not Found" });
    } else {
      const withdrawal = await Withdrawal.findByIdAndDelete({
        _id: withdrawalToDelete._id,
      });
      if (!withdrawal) {
        res.status(StatusCodes.NOT_FOUND).json({
          msg: `Withdrawal record with id ${req.params.id} was not found`,
        });
      } else {
        res
          .status(StatusCodes.OK)
          .json({ msg: "Withdrawal record has been deleted..." });
      }
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminUpdateDeposit = async (req, res) => {
  const { coin, amount, status } = req.body;

  if (coin === "" || amount === "" || status === "") {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "You can't send an empty field" });
  } else {
    const depositToUpdate = await Deposit.findOne({
      _id: req.params.id,
    });
    if (!depositToUpdate) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Deposit Records Not Found" });
    } else {
      const deposit = await Deposit.findByIdAndUpdate(
        { _id: depositToUpdate._id },
        req.body,
        {
          new: false,
          runValidators: true,
        }
      );
      if (!deposit) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ msg: "User update failed" });
      } else {
        res.status(StatusCodes.OK).json({ deposit });
      }
    }
  }
};

const adminDeleteDeposit = async (req, res) => {
  try {
    const depositToDelete = await Deposit.findOne({
      _id: req.params.id,
    });
    if (!depositToDelete) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Deposit Records Not Found" });
    } else {
      const deposit = await Deposit.findByIdAndDelete({
        _id: depositToDelete._id,
      });
      if (!deposit) {
        res.status(StatusCodes.NOT_FOUND).json({
          msg: `Deposit record with id ${req.params.id} was not found`,
        });
      } else {
        res
          .status(StatusCodes.OK)
          .json({ msg: "Deposit record has been deleted..." });
      }
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetVerificationInfo = async (req, res) => {
  const id = req.params.id;
  try {
    const verification = await Verification.find({ owner: id }).sort({
      createdAt: -1,
    });
    if (!verification) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "No erification for this user" });
    } else {
      res.status(StatusCodes.OK).json(verification);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetTransfers = async (req, res) => {
  const id = req.params.id;
  try {
    const transfer = await Transfer.find({ owner: id }).sort({ createdAt: -1 });
    if (!transfer) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Transfer records not foundt" });
    } else {
      res.status(StatusCodes.OK).json(transfer);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetTransfer = async (req, res) => {
  const id = req.params.id;
  try {
    const transfer = await Transfer.findOne({ _id: id });

    if (!transfer) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Transfer record doesn't exist" });
    } else {
      res.status(StatusCodes.OK).json(transfer);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminUpdateTransfer = async (req, res) => {
  const { coin, amount, status, walletAddress } = req.body;

  if (coin === "" || amount === "" || status === "" || walletAddress === "") {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "You can't send an empty field" });
  } else {
    const transferToUpdate = await Transfer.findOne({
      _id: req.params.id,
    });
    if (!transferToUpdate) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Transfer Records Not Found" });
    } else {
      const transfer = await Transfer.findByIdAndUpdate(
        { _id: transferToUpdate._id },
        req.body,
        {
          new: false,
          runValidators: true,
        }
      );
      if (!transfer) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ msg: "User update failed" });
      } else {
        res.status(StatusCodes.OK).json({ transfer });
      }
    }
  }
};

const adminDeleteTransfer = async (req, res) => {
  const id = req.params.id;

  try {
    const transferToDelete = await Transfer.findOne({
      _id: id,
    });
    if (!transferToDelete) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Transfer Records Not Found" });
    } else {
      const transfer = await Transfer.findByIdAndDelete({
        _id: transferToDelete._id,
      });
      if (!transfer) {
        res.status(StatusCodes.NOT_FOUND).json({
          msg: `Transfer record with id ${req.params.id} was not found`,
        });
      } else {
        res
          .status(StatusCodes.OK)
          .json({ msg: "Withdrawal record has been deleted..." });
      }
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetUserReferrals = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User Not Found" });
    } else {
    }

    const users = await User.find();

    if (!users) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Users Not Found" });
    } else {
      const usersRef = users.map((ref) => {
        const refs = ref.referral;
        const username = user.username.toString().toLowerCase();
        const referral = refs.toString().toLowerCase();

        let isTrue = lodash.isEqual(referral, username);
        if (isTrue) {
          return refs;
        } else {
          return null;
        }
      });

      const referralslist = usersRef.filter((item) => item === user.username);

      return res.status(200).json(referralslist);
    }
  } catch (error) {
    console.log(error);
  }
};

const adminGetUserReferralNames = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User Not Found" });
    } else {
    }

    const users = await User.find();

    if (!users) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Users Not Found" });
    } else {
      const usersRef = users.map((ref) => {
        const refs = ref.referral;
        const username = user.username.toString().toLowerCase();
        const referral = refs.toString().toLowerCase();

        let isTrue = lodash.isEqual(referral, username);
        if (isTrue) {
          return ref.username;
        } else {
          return null;
        }
      });

      return res.status(200).json(usersRef);
    }
  } catch (error) {
    console.log(error);
  }
};

const getAllMessages = async (req, res) => {
  const query = req.query.new;
  try {
    const messages = query
      ? await UserSentMail.find().sort({ createdAt: -1 })
      : await UserSentMail.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getAllUsermessages = async (req, res) => {
  const ownerID = req.params.id;
  try {
    const messsages = await UserSentMail.find({ owner: ownerID }).sort({
      createdAt: -1,
    });
    if (!messsages) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "No messages available" });
    } else {
      res.status(StatusCodes.OK).json(messsages);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const deletemessage = async (req, res) => {
  try {
    const messageToDelete = await UserSentMail.findOne({
      _id: req.params.messageID,
    });
    if (!messageToDelete) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "Message not found" });
    } else {
      const deletedMessage = await UserSentMail.findByIdAndDelete({
        _id: req.params.messageID,
      });
      if (!deletedMessage) {
        res.status(StatusCodes.NOT_FOUND).json({
          msg: `Messsage not found`,
        });
      } else {
        res.status(StatusCodes.OK).json({ msg: "Message has been deleted..." });
      }
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const getAllUserSentMessages = async (req, res) => {
  const ownerID = req.params.id;
  try {
    const messsages = await SentEmail.find({ owner: ownerID }).sort({
      createdAt: -1,
    });
    if (!messsages) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "No messages available" });
    } else {
      res.status(StatusCodes.OK).json(messsages);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const deleteReceivedMessage = async (req, res) => {
  try {
    const messageToDelete = await SentEmail.findOne({
      _id: req.params.messageID,
    });
    if (!messageToDelete) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "Message not found" });
    } else {
      const deletedMessage = await SentEmail.findByIdAndDelete({
        _id: req.params.messageID,
      });
      if (!deletedMessage) {
        res.status(StatusCodes.NOT_FOUND).json({
          msg: `Messsage not found`,
        });
      } else {
        res.status(StatusCodes.OK).json({ msg: "Message has been deleted..." });
      }
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminSendOtpCode = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "This user doesn't exist" });
  }
  const withdrawn = await Withdrawal.findOne({ owner: user._id });
  if (!withdrawn) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "This user has not made any withdrawal request yet" });
  }
  if (user.withdrawalactive === true) {
    const codeAlreadySent = await OtpCode.findOne({ owner: user._id });
    if (codeAlreadySent) {
      await OtpCode.findOneAndDelete({ owner: user._id });
    }

    const generateRandomNumber = () => {
      const minm = 100000;
      const maxm = 999999;
      return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
    };
    const otp = generateRandomNumber();
    console.log(otp);

    const newCode = new OtpCode({
      owner: user._id,
      code: otp,
    });

    await newCode.save();
    const str1 = user.firstname;
    const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

    const str2 = user.lastname;
    const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const mailOptions = {
      from: "support@binacefxtrading.com",
      to: user.email,
      subject: `${otp} is your Passcode`,
      html: sendOtpCodeTemplate(otp, firstname, lastname),
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent successfully.");
      }
    });

    return res.status(StatusCodes.CREATED).json({
      otp: {
        owner: user._id,
        code: otp,
      },
      msg: "Email Sent Successfully",
    });
  }
};

const adminGetOtpCode = async (req, res) => {
  const id = req.params.id;
  try {
    const otp = await OtpCode.findOne({ owner: id });

    if (!otp) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "No otp Code for this user yet" });
    } else {
      res.status(StatusCodes.OK).json(otp);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const adminGetAllKyc = async (req, res) => {
  const query = req.query.new;
  try {
    const kyc = query
      ? await Kyc.find().sort({ createdAt: -1 })
      : await Kyc.find().sort({ createdAt: -1 });
    return res.status(200).json(kyc);
  } catch (error) {
    return res.status(500).json(error);
  }
};

const adminGetOneKyc = async (req, res) => {
  const id = req.params.id;
  try {
    const kyc = await Kyc.findOne({ _id: id });
    if (!kyc) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "No  KYC information available" });
    } else {
      return res.status(StatusCodes.OK).json(kyc);
    }
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

module.exports = {
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
  getAllUserSentMessages,
  deleteReceivedMessage,
  deletemessage,
  adminGetAllTransfers,
  adminSendOtpCode,
  adminGetOtpCode,
  adminGetOneKyc,
  adminGetAllKyc,
};
