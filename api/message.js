var router       = require('express').Router();
var config       = require('../config/config.js');
var request      = require('request');
var crypto       = require('crypto');
var convId       = '56e78d6a731956005c02339b';
var unreadConvId = '56f0f087da2f60004cb53f29';
var APP_ID       = process.env.LC_APP_ID || config.leanCloud.appId;
var MASTER_KEY   = process.env.LC_APP_MASTER_KEY || config.leanCloud.appMasterKey;
var _            = require('lodash');



router.post('/receive',function(req,res){
	var queue = req.body;

	var sysConv = "56f9f009daeb3a63ca5afe61";

	_.map(queue,function(params){
		//转发
		request.post({
		    url: 'https://leancloud.cn/1.1/rtm/messages',
		    headers: {
		      'X-LC-Id': APP_ID,
		      'X-LC-Key': MASTER_KEY + ',master',
		      'Content-Type': 'application/json'
		    },
		    json:true,
		    body: {
		      'from_peer': params.from,
		      'message':params.data,
		      'conv_id': sysConv,
		      'transient': false
		    }
		});		
	})
});

router.get('/create',function (req,res) {
	request.post({
	    url: 'https://api.leancloud.cn/1.1/classes/_Conversation',
	    headers: {
	      'X-LC-Id': APP_ID,
	      'X-LC-Key': MASTER_KEY + ',master',
	      'Content-Type': 'application/json'
	    },
	    json:true,
	    body:{
	    	"name": "unread Channel",
	    }
	}, function (error, response, body) {
	    console.log('send message : '+ JSON.stringify(body));
	});
})

router.get('/md5',function (req,res) {
	var clientId = encodeURI(req.query.clientId);
	var conv_Id = req.query.convId;
	var aa = crypto.createHash('md5').update(conv_Id + ":" + clientId,'utf-8').digest('hex');
	res.send(aa);
});

router.get('/',function (req,res) {

	var clientId = encodeURI(req.query.clientId);
	var conv_Id = req.query.convId;
	var limit = req.query.limit;

	if(conv_Id == convId || conv_Id == unreadConvId){
		conv_Id = crypto.createHash('md5').update(conv_Id + ":" + clientId,'utf-8').digest('hex');
	}

	request.get({
	    url: 'https://leancloud.cn/1.1/rtm/messages/logs?convid='+conv_Id+'&limit='+limit,
	    headers: {
	      'X-LC-Id': APP_ID,
	      'X-LC-Key': MASTER_KEY + ',master',
	    }
	}, function (error, response, body) {
	    res.json(body);
	});
})


router.post('/',function (req,res) {
	var params = req.body;

	request.post({
	    url: 'https://leancloud.cn/1.1/rtm/messages',
	    headers: {
	      'X-LC-Id': APP_ID,
	      'X-LC-Key': MASTER_KEY + ',master',
	      'Content-Type': 'application/json'
	    },
	    json:true,
	    body: {
	      'from_peer': params.from,
	      'message':JSON.stringify({
	        '_lctext': params.msg,
	        '_lctype': -1,
	        '_lcattrs':{
	        	'type':params.type
	        }
	      }),
	      'conv_id': params.convId,
	      'to_peers': [params.to],
	      'transient': false
	    }
	});
})

module.exports = router;