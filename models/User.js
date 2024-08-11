const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "Please enter your Firstname"],
      trim: true,
      lowercase: true,
    },
    lastname: {
      type: String,
      required: [true, "Please enter your lastname"],
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: [true, "Please enter your username"],
      match: [/^\b[a-zA-Z0-9_]+\b$/, "Please enter a valid username"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid Email",
      ],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: 8,
      select: false,
    },
    country: {
      type: String,
      required: [true, "Please select your country of recidence"],
    },
    region: {
      type: String,
      required: [true, "Please select your region"],
    },
    city: {
      type: String,
      default: "",
    },
    zip: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Please enter your phone number"],
    },
    occupation: {
      type: String,
      required: [true, "Please enter your occupation"],
    },
    referral: {
      type: String,
      default: "",
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    withdrawnbalance: {
      type: Number,
      default: 0,
    },
    transferredbalance: {
      type: Number,
      default: 0,
    },
    withdrawalactive: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: "",
    },
    BTC: {
      name: {
        type: String,
        default: "Bitcoin",
      },
      logo: {
        type: String,
        default: "https://i.imgur.com/Lh9hdU2.png",
      },
      walletImg: {
        type: String,
        default: "https://i.imgur.com/uiMPVqe.jpeg",
      },
      walletAddress: {
        type: String,
        default: " 1KVfZSEbo8Avc7u485NbgGQy8JZQQh5rHD",
      },
      deposit: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      profit: {
        type: Number,
        default: 0,
      },
      bonus: {
        type: Number,
        default: 0,
      },
    },
    ETH: {
      name: {
        type: String,
        default: "Etheruem",
      },
      logo: {
        type: String,
        default: "https://i.imgur.com/VSGKPLd.png",
      },
      walletImg: {
        type: String,
        default: "https://i.imgur.com/ENuuhgV.jpeg",
      },
      walletAddress: {
        type: String,
        default: "0xd994cdd2ae6ee79bfb06fd1df9753076633b0c7b",
      },
      deposit: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      profit: {
        type: Number,
        default: 0,
      },

      bonus: {
        type: Number,
        default: 0,
      },
    },
    BNB: {
      name: {
        type: String,
        default: "Binance coin",
      },
      logo: {
        type: String,
        default: "https://i.imgur.com/OyKFAvw.png",
      },
      walletImg: {
        type: String,
        default: "https://i.imgur.com/3A3V3Yn.jpeg",
      },
      walletAddress: {
        type: String,
        default: "bnb1cyfkm5z7lspg3d2sazjygw24cwr8csqga70pj9",
      },
      deposit: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      profit: {
        type: Number,
        default: 0,
      },

      bonus: {
        type: Number,
        default: 0,
      },
    },
    USDT: {
      name: {
        type: String,
        default: "Tether",
      },
      logo: {
        type: String,
        default: "https://i.imgur.com/Sjieype.png",
      },
      walletImg: {
        type: String,
        default: "https://i.imgur.com/ndBEDKg.jpeg",
      },
      walletAddress: {
        type: String,
        default: "TSRpoA8126NHXFEZwsQaD7vmLANLuNuVDb",
      },
      deposit: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      profit: {
        type: Number,
        default: 0,
      },

      bonus: {
        type: Number,
        default: 0,
      },
    },
    LTC: {
      name: {
        type: String,
        default: "Litecoin",
      },
      logo: {
        type: String,
        default: "https://i.imgur.com/ZGG3Uzl.png",
      },
      walletImg: {
        type: String,
        default: "https://i.imgur.com/lRtkyq3.jpeg",
      },
      walletAddress: {
        type: String,
        default: "MNjb2VoAbirYLbtedDYK4pjcvhgN8Au2HF",
      },
      deposit: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      profit: {
        type: Number,
        default: 0,
      },
      bonus: {
        type: Number,
        default: 0,
      },
    },
    BCH: {
      name: {
        type: String,
        default: "Bitcoin Cash",
      },
      logo: {
        type: String,
        default: "https://i.imgur.com/hFf36e7.png",
      },
      walletImg: {
        type: String,
        default: "https://i.imgur.com/dUyl9Ig.jpeg",
      },
      walletAddress: {
        type: String,
        default: "qq5frd2m0y2agkcchhn3d8m83k0kxtng5q4ym2rrq4",
      },
      deposit: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      profit: {
        type: Number,
        default: 0,
      },

      bonus: {
        type: Number,
        default: 0,
      },
    },
    active: {
      type: Boolean,
      default: false,
    },
    verificationinitiated: {
      type: Boolean,
      default: false,
    },
    verificationstatus: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: String,
      default: "Not Verified",
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userID: this._id,
      firstname: this.firstname,
      lastname: this.lastname,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};

UserSchema.methods.comparePassword = async function (userPassword) {
  const isMatch = await bcrypt.compare(userPassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
