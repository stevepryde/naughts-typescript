import express = require("express");
import bodyParser = require("body-parser");
import winston = require("winston");
import expressWinston = require("express-winston");
import cors = require("cors");
import fs = require("fs");
import path = require("path");
require("dotenv");

import gameRoutes from "./game";
import botdbRoutes from "./botdb";

const app = express();

var https;
const SSL_ENABLED = (process.env.NAUGHTS_ENABLE_SSL || "false").toLowerCase() == "true";
const CERTPATH = process.env.NAUGHTS_CERT_PATH || "~/certs";

if (SSL_ENABLED) {
  try {
    var options = {
      key: fs.readFileSync(path.join(CERTPATH, "privkey.pem")),
      cert: fs.readFileSync(path.join(CERTPATH, "cert.pem")),
      ca: fs.readFileSync(path.join(CERTPATH, "chain.pem"))
    };
    https = require("https").Server(options, app);
  } catch (e) {
    console.log("Failed to load SSL cert: " + e);
    process.exit(1);
  }
} else {
  console.log("SSL Disabled");
  https = require("http").Server(app);
}

const allowedOrigin = process.env.NODE_ENV === "production" ? "https://ai.stevepryde.com" : "*";
const corsOptions = {
  origin: allowedOrigin
  // optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

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

app.use("/game", gameRoutes);
app.use("/botdb", botdbRoutes);

var server = https.listen(5009, function() {
  console.log("Server running on port:", server.address().port);
});
