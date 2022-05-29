var express = require('express');
var router = express.Router();


var session_controller = require('../controllers/session');

router.get('/get_active_session', session_controller.get_active_session);

router.post('/create_new_session', session_controller.create_new_session);

module.exports = router;
