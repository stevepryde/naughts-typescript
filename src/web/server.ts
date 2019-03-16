import express = require("express");
import bodyParser = require("body-parser");
import winston = require("winston");
import expressWinston = require("express-winston");
import cors = require("cors");

import gameRoutes from "./game";

const app = express();

const whitelist =
  process.env.NODE_ENV === "production" ? ["https://stevepryde.com"] : ["http://localhost:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed"));
    }
  }
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function(req, res) {
      return false;
    } // optional: allows to skip some log messages based on request and/or response
  })
);

// app.use("/", function(req, res) {
//   res.json({ message: "Hello World" });
// });

app.use("/game", gameRoutes);

var server = app.listen(5009, function() {
  console.log("Server running on port:", server.address().port);
});
