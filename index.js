require("dotenv").config();
require("express-async-errors");

//extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const ratelimiter = require("express-rate-limit");

const express = require("express");

const bodyParser = require("body-parser");

const app = express();

const connectDB = require("./db/connect");

//Routers
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");

//Error handlers
const notFoundMiddleware = require("./middlewares/not-found");
const errorHandlerMiddleware = require("./middlewares/error-handler");

app.set("trust proxy", 1);

app.use(
  ratelimiter({
    windowMS: 15 * 60 * 1000,
    max: 100,
  })
);
app.use(express.urlencoded({ extended: true, limit: 10000 }));
app.use(bodyParser.json());
app.use(express.json());
app.use(helmet());
app.use(xss());

// const corsOptions = {
//   origin: ["http://forex-gurus.com", "http://localhost:3000"],
//   credentials: true,
//   optionSuccessStatus: 200,
// };

let ALLOWED_ORIGINS = ["http://localhost:3000", "https://binacefxtrading.com"];

app.use((req, res, next) => {
  let origin = req.headers.origin;
  let theOrigin =
    ALLOWED_ORIGINS.indexOf(origin) >= 0 ? origin : ALLOWED_ORIGINS[0];
  res.header("Access-Control-Allow-Origin", theOrigin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to Binance Fx Trading");
});

//Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

app.engine("html", require("ejs").renderFile);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
