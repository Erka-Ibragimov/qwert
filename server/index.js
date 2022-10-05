require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error-middleware");
const app = express();
const PORT = process.env.PORT || 6000;
const bodyParser = require("body-parser");
const router = require("./router/index");

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use("/api", router);
app.use(errorMiddleware);

const start = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};
start();
