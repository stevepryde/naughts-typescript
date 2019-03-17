import express = require("express");
import bodyParser = require("body-parser");
import winston = require("winston");
import expressWinston = require("express-winston");
import cors = require("cors");
require("dotenv");

import botdbRoutes from "./botdb";

const app = express();

app.use(cors());
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

app.use("/botdb", botdbRoutes);

var server = app.listen(5008, function() {
  console.log("Server running on port:", server.address().port);
});
