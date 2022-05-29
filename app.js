"use strict";

const asyncify = require('express-asyncify')
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = asyncify(express()).use(body_parser.json());


app.use(express.json());
var session = require('./routes/session.js')
var message = require('./routes/message');

app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.use('/', message);
app.use('/session', session);
