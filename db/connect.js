const mongoose = require("mongoose");

const connectDB = async (url) => {
  return mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
     
    })
    .then(() => {
      console.log("Connection to database was successful");
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = connectDB;
