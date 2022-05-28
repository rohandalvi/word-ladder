"use strict";

const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json());


app.use(express.json());
var session = require('./session.js')
var sessionRouter = express.Router();


app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.use('/session', session);
