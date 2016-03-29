var router   = require('express').Router();
var message = require('./message.js');

router.use('/message',message);

module.exports = router;