var router       = require('express').Router();
var config       = require('../config/config.js');
var request      = require('request');
var crypto       = require('crypto');
var convId       = '56fb9bc5128fe10050cb25bc';
var unreadConvId = '56fb9bde1ea493005d1b1cae';
var APP_ID       = process.env.LC_APP_ID || config.leanCloud.appId;
var MASTER_KEY   = process.env.LC_APP_MASTER_KEY || config.leanCloud.appMasterKey;
var _            = require('lodash');
var q            = require('q');
var moment       = require('moment');



router.post('/receive',function(req,res){
	var queue = req.body;


	var sysConv = "56fba2ffdaeb3a63ca5affa3";

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
		},function(error, response, body){
			if(error){
				res.send({
					stats:101,
					msg:'转发消息失败',
					err:error
				})
			}else{
			    res.send({
			    	status:100,
			    	msg:'ok'
			    })
		    }
		});		
	})
});

router.get('/test',function(req,res){
	var now = moment().format('x');
	var sign = crypto.createHash('md5').update(now + "rnxopmMcgIn0GQpARAYxzbcj").digest('hex');
	sign += (','+now+',master');
	request({
	    // url: 'https://leancloud.cn/1.1/rtm/messages/logs?convid=56fb44737db2a200509263b9',
	    url:'https://leancloud.cn/1.1/rtm/messages/unread/912288__u77_259301__u77_avatar.jpg',
	    headers:{
	      'X-LC-Id': "miBNAt0bIsYelizPvxkjgBFW-gzGzoHsz",
	      // 'X-LC-Sign': sign,
	      "X-LC-Key": "aaKFq8QIg26ED1yOjkO903P2",
	      // 'Content-Type': 'application/json'
	    },
	    // json:true,
	},function(err,response,body) {
		console.log(body);
	});
	res.send('ok');
})

router.get('/delete',function(req,res){
	var params = req.query;

	getMessage(params.clientId,params.convId,20).then(function(result){
		res.send(result);
	},function(err){
		res.send(err);
	})

	// //删除
	// request.del({
	//     url: 'https://leancloud.cn/1.1/rtm/messages/logs?convid='+sysConv+'&msgid='+msgId+'&timestamp='+timestamp,
	//     headers: {
	//       'X-LC-Id': APP_ID,
	//       'X-LC-Key': MASTER_KEY + ',master',
	//       'Content-Type': 'application/json'
	//     },
	//     json:true,
	// });		
});

function getMessage(clientId,conv_Id,limit){
	var searchDeffer = q.defer();
	var now = moment().format('x');
	var sign = crypto.createHash('md5').update(now + MASTER_KEY).digest('hex');
	sign += (','+now+',master');
	request.get({
	    url: 'https://leancloud.cn/1.1/rtm/messages/logs?convid='+conv_Id,
	    headers:{
	      'X-LC-Id': APP_ID,
	      'X-LC-Sign': sign,
	      'Content-Type': 'application/json'
	    },
	    json:true,
	}, function (error, response, body) {
		var queue = [];
	    _.map(body,function(msg){
	    	if(msg.from == clientId){
	    		var promise = deleteMessage(msg["msg-id"],conv_Id,msg["timestamp"]);
	    		queue.push(promise);	
	    	}
	    })
	    var n=0;
	    _.map(queue,function(promise){
	    	promise.then(function(result){
	    		n++;
	    		if(n == queue.length){
	    			if(n == limit){
	    				getMessage(clientId,conv_Id,limit);
	    			}else{
	    				searchDeffer.resolve({
	    					status:100,
		    				msg:'ok'
	    				});
	    			}
	    		}
	    	},function(err){
	    		searchDeffer.reject(err);
	    	})
	    });

	});		
	return searchDeffer.promise;
}

function deleteMessage(msgId,conv_Id,timestamp){
	msgId = encodeURIComponent(msgId);
	var deffer = q.defer();
	//删除
	request.del({
	    url: 'https://leancloud.cn/1.1/rtm/messages/logs?convid='+conv_Id+'&msgid='+msgId+'&timestamp='+timestamp,
	    headers: {
	      'X-LC-Id': APP_ID,
	      'X-LC-Key': MASTER_KEY + ',master',
	      'Content-Type': 'application/json'
	    },
	    json:true,
	},function(error, response, body){
		if(error){
			deffer.reject({
				stats:101,
				msg:'删除消息失败',
				err:error
			})
		}else{
		    deffer.resolve({
		    	status:100,
		    	msg:'ok'
		    })
	    }
	});	
	return deffer.promise;
}

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
	    	"name": "Unread Channel",
	    	"sys":true
	    }
	}, function (error, response, body) {
	    console.log('send message : '+ JSON.stringify(body));
	});
})

router.get('/md5',function (req,res) {
	var clientId = req.query.clientId;
	var conv_Id = req.query.convId;
	var aa = crypto.createHash('md5').update(conv_Id + ":" + clientId,'utf-8').digest('hex');
	res.send(aa);
});

router.get('/',function (req,res) {

	var clientId = req.query.clientId;
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

	if(params.to){
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
		}, function (error, response, body) {
			if(error){
				res.send({
					stats:101,
					msg:'发送消息失败',
					err:error
				})
			}else{
			    res.send({
			    	status:100,
			    	msg:'ok'
			    });
		    }
		});
	}else{
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
		      'transient': false
		    }
		}, function (error, response, body) {
		    if(error){
				res.send({
					stats:101,
					msg:'发送消息失败',
					err:error
				})
			}else{
			    res.send({
			    	status:100,
			    	msg:'ok'
			    });
		    }
		});
	}

	
})

module.exports = router;