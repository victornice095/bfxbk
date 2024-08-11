const User = require("../models/User");
const Message = require("../models/Message");
const Withdrawal = require("../models/Withdrawal");
const Deposit = require("../models/Deposit");
const VerificationToken = require("../models/VerifyEmail");
const Kyc = require("../models/Kyc");
const ResetToken = require("../models/ResetPassword");
const UserSentMail = require("../models/UserSentMail");
const OtpCode = require("../models/OtpCode");
const { createRandomBytes } = require("../utils/helper");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
const { signupEmailTemplate } = require("../templates/signupEmail");
const { verifySuccessTemplate } = require("../templates/verifySuccess");
const { resetPasswordTemplate } = require("../templates/resetPassword");
const { resetSuccessTemplate } = require("../templates/resetSuccess");
const { withdrawalRequestTemplate } = require("../templates/withdrawalRequest");
const { depositRequestTemplate } = require("../templates/depositRequest");
const { transferRequestTemplate } = require("../templates/transferRequest");
const SentEmail = require("../models/SentEmail");
const Transfer = require("../models/Transfer");
const lodash = require("lodash");
const cloudinary = require("../middlewares/cloudinary1");

const mailgunAuth = {
  auth: {
    api_key: process.env.MAIL_KEY,
    domain: process.env.MAIL_DOMAIN,
  },
};

const signup = async (req, res) => {
  const {
    firstname,
    lastname,
    username,
    email,
    password,
    country,
    region,
    phone,
    occupation,
    referral,
  } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Email already exist!" });
  }
  const usern = await User.findOne({ username });
  if (usern) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Username already exist!" });
  }

  const newUser = new User({
    firstname,
    lastname,
    email,
    username,
    password,
    country,
    region,
    phone,
    occupation,
    referral,
  });

  const verificationToken = await VerificationToken.findOne({
    owner: newUser._id,
  });
  if (verificationToken) {
    throw new BadRequestError(
      "Only after one hour can you request for another token!"
    );
  } else {
    const randomToken = await createRandomBytes();

    const verifyToken = new VerificationToken({
      owner: newUser._id,
      token: randomToken,
    });
    await verifyToken.save();

    const str1 = firstname;
    const name = str1.charAt(0).toUpperCase() + str1.slice(1);

    const newuser = newUser._id;

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const mailOptions = {
      from: "support@binacefxtrading.com",
      to: newUser.email,
      subject: " Confirm Your Account",
      html: signupEmailTemplate(name, newuser, randomToken),
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Successfully sent verification email.");
      }
    });

    const token = newUser.createJWT();

    await newUser.save();

    res.status(StatusCodes.CREATED).json({
      user: {
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        username: newUser.username,
        email: newUser.email,
      },
      token,
      msg: "Email Verification Link Sent",
    });
  }
};

const resendconfimationmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Invalid email supplied!" });
  }

  const verificationToken = await VerificationToken.findOne({
    owner: user._id,
  });
  if (verificationToken) {
    throw new BadRequestError(
      "Only after one hour can you request for another verification email!"
    );
  }

  const randomToken = await createRandomBytes();

  const verifyToken = new VerificationToken({
    owner: user._id,
    token: randomToken,
  });

  await verifyToken.save();

  const newuser = user._id;
  const firstname = user.firstname;

  const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

  const mailOptions = {
    from: "support@binacefxtrading.com",
    to: user.email,
    subject: " Email Verification Link",
    html: signupEmailTemplate(firstname, newuser, randomToken),
  };

  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Successfully sent verification email.");
    }
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Email Verification Link Sent",
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new UnauthenticatedError("Invalid credentials supllied");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials supllied");
  }

  const isActive = user.active;
  if (!isActive) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "Check your mailbox for email verification link. You need to verify your email before you can login.",
    });
  }
  const token = user.createJWT();

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      email: user.email,
    },
    token,
  });
};

const getuser = async (req, res) => {
  const id = req.params.userID;

  const user = await User.findOne({ _id: id });

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User Not Found" });
  } else {
    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        country: user.country,
        region: user.region,
        phone: user.phone,
        city: user.city,
        zip: user.zip,
        image: user.image,
        occupation: user.occupation,
        referral: user.referral,
        referralEarnings: user.referralEarnings,
        BTC: user.BTC,
        ETH: user.ETH,
        BNB: user.BNB,
        USDT: user.USDT,
        LTC: user.LTC,
        BCH: user.BCH,
        verified: user.verified,
        createdAt: user.createdAt,
        active: user.active,
        verificationinitiated: user.verificationinitiated,
        verificationstatus: user.verificationstatus,
        verified: user.verified,
        status: user.status,
        withdrawnbalance: user.withdrawnbalance,
        transferredbalance: user.transferredbalance,
        withdrawalactive: user.withdrawalactive,
      },
      token,
    });
  }
};

const updateuser = async (req, res) => {
  const { email } = req.body;
  try {
    if (req.file) {
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ msg: "User Not Found" });
      }
      const result = await cloudinary.uploader.upload(req.file.path);
      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          zip: req.body.zip,
          city: req.body.city,
          occupation: req.body.occupation,
          phone: req.body.phone,
          image: result.secure_url,
        }
      ),
        {
          new: false,
          runValidators: false,
        };

      return res.status(StatusCodes.CREATED).json({
        msg: "User information updated successfully",
      });
    } else {
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ msg: "User Not Found" });
      }

      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          zip: req.body.zip,
          city: req.body.city,
          occupation: req.body.occupation,
          phone: req.body.phone,
        }
      ),
        {
          new: false,
          runValidators: false,
        };

      return res.status(StatusCodes.CREATED).json({
        msg: "User information updated successfully",
      });
    }

    // if (req.urls.data === []) {
    //   await User.findByIdAndUpdate({ _id: user._id }, req.body, {
    //     new: false,
    //     runValidators: false,
    //   });
    //   return res.status(StatusCodes.CREATED).json({
    //     msg: "User information updated successfully",
    //   });
    // }
    // if (req.urls.data !== []) {
    //   await User.findByIdAndUpdate(
    //     { _id: user._id },
    //     (req.body,
    //     {
    //       image: req.urls.data[0].url,
    //     }),
    //     {
    //       new: false,
    //       runValidators: false,
    //     }
    //   );
    //   return res.status(StatusCodes.CREATED).json({
    //     image: req.urls.data[0].url,
    //     msg: "User information updated successfully",
    //   });
    // }
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "An error occured!",
    });
  }

  // const user = await User.findOne({ _id: id });

  // if (!user) {
  //   return res.status(StatusCodes.NOT_FOUND).json({ msg: "User Not Found" });
  // }
  // if (req.file) {
  //   const upload = await cloudinary.v2.uploader.upload(req.file.path);
  //   await User.updateOne({ owner: user_id }, { image: upload.secure_url });

  // }
  // const userUpdate = await User.findByIdAndUpdate(
  //   { _id: req.params.userID },
  //   req.body,
  //   {
  //     new: false,
  //     runValidators: true,
  //   }
  // );
  // if (!userUpdate) {
  //   res
  //     .status(StatusCodes.INTERNAL_SERVER_ERROR)
  //     .json({ msg: "User update failed" });
  // } else {
  //   res.status(StatusCodes.OK).json({ userUpdate });
  // }
};

const verifyemail = async (req, res) => {
  const { userID, emailToken } = req.params;

  const user = await User.findOne({
    _id: userID,
  });

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).render("email1.html");
  }
  try {
    const verifyUser = await VerificationToken.findOne(
      {
        owner: user._id,
      },
      { token: req.params.emailToken }
    );
    if (!verifyUser) {
      const userActive = await User.findOne({ _id: userID });
      if (!userActive.active) {
        await User.deleteOne({ _id: user._id });
        return res.status(StatusCodes.FORBIDDEN).render("email2.html");
      } else {
        return res.status(StatusCodes.FORBIDDEN).render("email3.html");
      }
    } else {
      const resetToken = await VerificationToken.findOne({ owner: user._id });
      const isValid = await resetToken.compareToken(emailToken);
      if (!isValid) {
        return res.status(StatusCodes.FORBIDDEN).render("email4.html");
      } else {
        await User.updateOne({ _id: userID }, { active: true });
        await VerificationToken.deleteOne({ owner: userID });

        const str1 = user.firstname;
        const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

        const str2 = user.lastname;
        const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

        const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

        const mailOptions = {
          from: "support@binacefxtrading.com",
          to: user.email,
          subject: "Email Verification Successful",
          html: verifySuccessTemplate(firstname, lastname),
        };

        smtpTransport.sendMail(mailOptions, function (error, response) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email Verification Successful.");
          }
        });

        return res.status(StatusCodes.OK).render("email5.html");
      }
    }
  } catch (error) {
    return res.status(StatusCodes.OK).render("email6.html");
  }
};

const forgotpassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError("Please provide a valid email");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError("User not found, invalid request!");
  }
  const token = await ResetToken.findOne({ owner: user._id });
  if (token) {
    throw new BadRequestError(
      "Only after one hour you can request for another token!"
    );
  }
  const randToken = await createRandomBytes();

  const resetToken = new ResetToken({ owner: user._id, token: randToken });
  await resetToken.save();

  const str1 = user.firstname;
  const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

  const str2 = user.lastname;
  const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);
  const userid = user._id;

  const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

  const mailOptions = {
    from: "support@binacefxtrading.com",
    to: user.email,
    subject: "Reset Your Password",
    html: resetPasswordTemplate(firstname, lastname, randToken, userid),
  };

  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Password reset link sent.");
    }
  });

  return res.status(StatusCodes.OK).json({
    user: {
      Id: user._id,
      email: user.email,
    },
    success: true,
    msg: "Password Reset Link Sent Successfully",
  });
};

const resetpassword = async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, msg: "User not found!" });
  }
  const isSamePassword = await user.comparePassword(password);
  if (isSamePassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: "New Password must be different from old Password!",
    });
  }
  if (password.trim().length < 8 || password.trim().length > 20) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: "Passwor must be 8 to 20 characters long!",
    });
  }
  user.password = password.trim();

  await user.save();

  await ResetToken.findOneAndDelete({ owner: user._id });

  const firstname = user.firstname;
  const lastname = user.lastname;

  const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

  const mailOptions = {
    from: "support@binacefxtrading.com",
    to: user.email,
    subject: "Password Reset Successful",
    html: resetSuccessTemplate(firstname, lastname),
  };

  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Password reset successful.");
    }
  });

  return res.status(StatusCodes.OK).json({
    user: {
      Id: user._id,
      email: user.email,
    },
    success: true,
    msg: "Password Reset Successful",
  });
};

const kycverification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const kyc = new Kyc({
      owner: user._id,
      documenttype: req.body.documenttype,
      email: req.body.email,
      image: req.urls.data,
    });
    await User.updateOne(
      { email: req.body.email },
      { verificationinitiated: true }
    );
    await kyc.save().then(() => {
      return res.status(StatusCodes.CREATED).json({
        user: {
          id: kyc._id,
          documenttype: kyc.documenttype,
          email: kyc.email,
          image: kyc.image,
        },
        msg: "Verification process initiated successfully",
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "An error occured!",
    });
  }
};

const messaged = async (req, res) => {
  const { name, email, subject, message } = req.body;
  const newMessage = new Message({ name, email, subject, message });

  await newMessage.save();

  res.status(StatusCodes.CREATED).json({
    user: {
      name: newMessage.name,
      email: newMessage.email,
      subject: newMessage.subject,
      message: newMessage.message,
    },
    msg: "Your message was successfully sent",
  });
};

const deposit = async (req, res) => {
  const { email, coin, amount, plan } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "User not found" });
  }
  if (plan === "silver") {
    const newDeposit = new Deposit({
      owner: user._id,
      email,
      coin,
      plan,
      amount,
      maturitytime: "3 Days",
    });

    await newDeposit.save();
    const str1 = user.firstname;
    const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

    const str2 = user.lastname;
    const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const mailOptions = {
      from: "support@binacefxtrading.com",
      to: user.email,
      subject: "Deposit Request Successfully Received ",
      html: depositRequestTemplate(firstname, lastname, amount),
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Deposit request was successful.");
      }
    });

    return res.status(StatusCodes.CREATED).json({
      deposit: {
        email: newDeposit.email,
        coin: newDeposit.coin,
        amount: newDeposit.amount,
      },
      msg: "Deposit request submitted and is under review.",
    });
  }
  if (plan === "pro") {
    const newDeposit = new Deposit({
      owner: user._id,
      email,
      coin,
      plan,
      amount,
      maturitytime: "3 days",
    });

    await newDeposit.save();
    const str1 = user.firstname;
    const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

    const str2 = user.lastname;
    const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const mailOptions = {
      from: "support@binacefxtrading.com",
      to: user.email,
      subject: "Deposit Request Successfully Received ",
      html: depositRequestTemplate(firstname, lastname, amount),
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Deposit request was successful.");
      }
    });

    return res.status(StatusCodes.CREATED).json({
      deposit: {
        email: newDeposit.email,
        coin: newDeposit.coin,
        amount: newDeposit.amount,
      },
      msg: "Deposit request submitted and is under review.",
    });
  }
  if (plan === "premium") {
    const newDeposit = new Deposit({
      owner: user._id,
      email,
      coin,
      plan,
      amount,
      maturitytime: "3 Hours",
    });

    await newDeposit.save();
    const str1 = user.firstname;
    const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

    const str2 = user.lastname;
    const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const mailOptions = {
      from: "support@binacefxtrading.com",
      to: user.email,
      subject: "Deposit Request Successfully Received ",
      html: depositRequestTemplate(firstname, lastname, amount),
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Deposit request was successful.");
      }
    });

    return res.status(StatusCodes.CREATED).json({
      deposit: {
        email: newDeposit.email,
        coin: newDeposit.coin,
        amount: newDeposit.amount,
      },
      msg: "Deposit request submitted and is under review.",
    });
  }
};

const getdeposit = async (req, res) => {
  const userID = req.params.userID;
  try {
    const deposit = await Deposit.find({ owner: userID }).sort({
      createdAt: -1,
    });
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

const withdrawal = async (req, res) => {
  const { type } = req.body;
  try {
    if (type === "crypto") {
      const { email, coin, amount, walletAddress, comment } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ msg: "User not found" });
      }
      const newWithdrawal = new Withdrawal({
        owner: user._id,
        email,
        type,
        coin,
        amount,
        walletAddress,
        comment,
        active: true,
      });

      await newWithdrawal.save();
      await User.updateOne({ email: email }, { withdrawalactive: true });

      const str1 = user.firstname;
      const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

      const str2 = user.lastname;
      const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

      const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

      const mailOptions = {
        from: "support@binacefxtrading.com",
        to: user.email,
        subject: "Withdrawal Request Successfully Sent",
        html: withdrawalRequestTemplate(firstname, lastname, amount),
      };

      smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
          console.log(error);
        } else {
          console.log("Withdrawal request was successful.");
        }
      });
      return res.status(StatusCodes.CREATED).json({
        msg: "Withdrawal request submitted and is under review.",
      });
    }
    if (type === "paypal") {
      const { email, amount, details, comment } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ msg: "User not found" });
      }
      const newWithdrawal = new Withdrawal({
        owner: user._id,
        email,
        amount,
        type,
        details,
        comment,
        active: true,
      });

      await newWithdrawal.save();
      await User.updateOne({ email: email }, { withdrawalactive: true });

      const str1 = user.firstname;
      const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

      const str2 = user.lastname;
      const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

      const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

      const mailOptions = {
        from: "support@binacefxtrading.com",
        to: user.email,
        subject: "Withdrawal Request Successfully Sent",
        html: withdrawalRequestTemplate(firstname, lastname, amount),
      };

      smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
          console.log(error);
        } else {
          console.log("Withdrawal request was successful.");
        }
      });
      return res.status(StatusCodes.CREATED).json({
        msg: "Withdrawal request submitted and is under review.",
      });
    }
    if (type === "cashapp") {
      const { email, amount, details, comment } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ msg: "User not found" });
      }
      const newWithdrawal = new Withdrawal({
        owner: user._id,
        email,
        amount,
        type,
        details,
        comment,
        active: true,
      });

      await newWithdrawal.save();
      await User.updateOne({ email: email }, { withdrawalactive: true });

      const str1 = user.firstname;
      const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

      const str2 = user.lastname;
      const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

      const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

      const mailOptions = {
        from: "support@binacefxtrading.com",
        to: user.email,
        subject: "Withdrawal Request Successfully Sent",
        html: withdrawalRequestTemplate(firstname, lastname, amount),
      };

      smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
          console.log(error);
        } else {
          console.log("Withdrawal request was successful.");
        }
      });
      return res.status(StatusCodes.CREATED).json({
        msg: "Withdrawal request submitted and is under review.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getwithdrawal = async (req, res) => {
  const userID = req.params.userID;
  try {
    const withdrawal = await Withdrawal.find({ owner: userID }).sort({
      createdAt: -1,
    });
    if (!withdrawal) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "You have not made any withdrawal request yet" });
    } else {
      res.status(StatusCodes.OK).json(withdrawal);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const updatepassword = async (req, res) => {
  const { oldPassword, newPassword, email } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, msg: "User not found!" });
  }
  const isSamePassword = await user.comparePassword(oldPassword);

  if (!isSamePassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: "Old password entered is incorrect",
    });
  } else {
    const notSamePassword = await user.comparePassword(newPassword);
    if (notSamePassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "New Password must be different from old Password!",
      });
    } else {
      if (newPassword.trim().length < 8 || newPassword.trim().length > 20) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          msg: "Password must be 8 to 20 characters long!",
        });
      }

      user.password = newPassword.trim();

      await user.save();
      return res.status(StatusCodes.OK).json({
        success: true,
        msg: "Password change was successful.",
      });
    }
  }
};

const sendmessage = async (req, res) => {
  const { email, title, message } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "User not found" });
  }

  const sendEmail = new UserSentMail({
    owner: user._id,
    email: email,
    title,
    message,
  });

  await sendEmail.save();

  res.status(StatusCodes.CREATED).json({
    msg: "Your message sent successfully.",
  });
};

const getallmessage = async (req, res) => {
  const ownerID = req.params.ownerID;
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

const getmessage = async (req, res) => {
  const id = req.params.messageID;
  try {
    const message = await UserSentMail.findById(id);
    if (message) {
      res.status(StatusCodes.OK).json(message);
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "Message not found" });
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

const getallreceivedmessage = async (req, res) => {
  const ownerID = req.params.ownerID;
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

const getreceivedmessage = async (req, res) => {
  try {
    const message = await SentEmail.findOne({ _id: req.params.messageID });

    if (!message) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: "Message not found" });
    } else {
      res.status(StatusCodes.OK).json(message);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const transfer = async (req, res) => {
  const { email, coin, amount, walletAddress } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "User not found" });
  }
  const newTransfer = new Transfer({
    owner: user._id,
    email,
    coin,
    amount,
    walletAddress,
  });

  await newTransfer.save();
  const str1 = user.firstname;
  const firstname = str1.charAt(0).toUpperCase() + str1.slice(1);

  const str2 = user.lastname;
  const lastname = str2.charAt(0).toUpperCase() + str2.slice(1);

  const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

  const mailOptions = {
    from: "support@binacefxtrading.com",
    to: user.email,
    subject: "Withdrawal Request Successfully Sent",
    html: transferRequestTemplate(firstname, lastname, amount),
  };

  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Transfer request was successful.");
    }
  });

  // const request = mailjet.post("send", { version: "v3.1" }).request({
  //   Messages: [
  //     {
  //       From: {
  //         Email: "support@binacefxtrading.com",
  //         Name: "Binance FX Trading",
  //       },
  //       To: [
  //         {
  //           Email: user.email,
  //           Name: user.firstname,
  //         },
  //       ],
  //       Subject: "Transfer Request Sent",
  //       TextPart: `Dear ${user.firstname}, welcome to Binance FX Trading!`,
  //       HTMLPart: transferRequestTemplate(firstname, lastname, amount)
  //     },
  //   ],
  // });
  // request
  //   .then((result) => {
  //     console.log(result.body);
  //   })
  //   .catch((err) => {
  //     console.log(err.statusCode);
  //   });

  res.status(StatusCodes.CREATED).json({
    user: {
      email: newTransfer.email,
      coin: newTransfer.coin,
      amount: newTransfer.amount,
      walletAddress: newTransfer.walletAddress,
    },
    msg: "Transfer request submitted and is under review.",
  });
};

const gettransfer = async (req, res) => {
  const userID = req.params.userID;
  try {
    const transfer = await Transfer.find({ owner: userID }).sort({
      createdAt: -1,
    });
    if (!transfer) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "You have not made any transfer request yet" });
    } else {
      res.status(StatusCodes.OK).json(transfer);
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const getreferrals = async (req, res) => {
  const id = req.params.userID;

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

const getreferralnames = async (req, res) => {
  const id = req.params.userID;

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

const verifyOtpCode = async (req, res) => {
  const { code, email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, msg: "User not found!" });
  }
  const otpcode = await OtpCode.findOne({ owner: user._id });
  if (!otpcode) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, msg: "otp code not found!" });
  }
  if (otpcode.code.toString() !== code.toString()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, msg: "Otp code entered is incorrect!" });
  }
  if (otpcode.code === code) {
    await OtpCode.findOneAndDelete({ owner: user._id });
    await User.updateOne({ owner: user_id }, { withdrawalactive: false });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      msg: "withdrawal request Authentication successful.",
    });
  }
};

module.exports = {
  signup,
  signin,
  getuser,
  forgotpassword,
  resetpassword,
  verifyemail,
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
};
