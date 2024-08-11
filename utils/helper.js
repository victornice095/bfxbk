const crypto = require('crypto')


const createRandomBytes = () =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buff) => {
      if (err) reject(err);
      const token = buff.toString("hex");
      resolve(token);
    });
  });
module.exports = { createRandomBytes };
