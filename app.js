var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var AV           = require('leanengine');
var _AV 		 = require('./config/AV');
var config       = require('./config/config');
var api = require('./api');

global.Update = _AV.Object.extend('Update');

app.use(AV.Cloud);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	type: function(req) {
		return /x-www-form-urlencoded/.test(req.headers['content-type']);
	},
	extended: false
}));

app.use(cookieParser());

// 跨域支持
app.all('/api/*', (req, res, next) => {
  var origin = req.headers.origin;
  if (config.whiteOrigins.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  }
  next();
});

app.use('/api',api);

module.exports = app;