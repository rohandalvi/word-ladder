var express = require('express');
var router = express.Router();

var mainController = require('../controllers/main');
router.post('/', mainController.handleMessage);

module.exports = router;