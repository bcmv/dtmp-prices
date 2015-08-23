var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var connection = mongoose.createConnection('mongodb://127.0.0.1/detempo-prices');
var _ = require('underscore')
var async = require('async')
var isJSON = require('is-json');
var request = require('request')
var request = request.defaults({jar: true})

var Formula = mongoose.Schema({
	key:'string',
	value:'string'
})
var Product = mongoose.Schema({
	product_id:'number',
	quoted_price:'number'
})
var Batch = connection.model('Batch', mongoose.Schema({
	batch_code:'string',
	formulas:[Formula],
	products:[Product]
},{strict:false}));
router.post('/:code', function(req, res) {
	var code = req.params.code.toLowerCase();
	var data = req.body.data;
	data = JSON.parse(data);
	//data.batch_code = code;
	Batch.update({batch_code:code},{$set:data},{upsert:true, overwrite:true}, function(err, c){
		console.log(arguments);
		res.end();
	})
});
router.get('/:code', function(req, res) {
	var code = req.params.code.toLowerCase();
	var filtered = [];
	var batch;
	async.waterfall([
		function filter(fn){
			filtered = _.filter(products, function(p){
				var p = p.tags;
				var t = p.toLowerCase().split(",");
				console.log(p,t)
				return t.indexOf(code) != -1;
			});
			console.log(filtered);
			fn()
		},
		function findFromDb(fn){
			Batch
			.findOne({batch_code:code})
			.lean()
			.exec(function(err, b){
				batch = b;
				fn()
			})
		},
		function map(fn){
			filtered = filtered.map(function(p){
				if(!batch){
					return p;
				}
				var found = _.find(batch.products, function(bp){ return bp.product_id == p.id;});
				if(found){
					p.quoted_price = found.quoted_price;
				}
				return p;
			});
			fn()
		}
	], function(err){
		formulas = batch ? JSON.stringify(batch.formulas) : "[]";
		res.render('batch', { code:code, products:filtered, formulas:formulas });
	});
});

module.exports = router;


function retrieveProducs(fn){
	request({
		url:'https://detempo.myshopify.com/admin/auth/login',
		method:'post',
		followAllRedirects:true,
		form:{
			login:'maldivianist@gmail.com',
			password:'asdfasdf.'
		}
	}, function(err, res, body){
		var prods = [];
		var since_id;
		async.forever(function(next){
			var url = 'https://detempo.myshopify.com/admin/products.json?limit=250';
			url = since_id ? url + '&since_id='+since_id : url;
			//console.log(url);
			request(url, function(err, res, body){
				if(err){
					return next(err);
				}
				if(!isJSON(body)){
					return next("err");
				}
				var data = JSON.parse(body);
				if(!data.products){
					return next("invalid data");
				}
				if(!data.products.length){
					return next("done");
				}
				var last = data.products[data.products.length-1];
				since_id = last.id;
				prods = prods.concat(data.products);
				next();
			});
		}, function(err){
			console.log('err', err);
			console.log(prods.length);
			fn(prods);
		});
	});    
}

var products = [];



async.forever(function(next){
	retrieveProducs(function(p){
		products = p;
		setTimeout(next, 5000);
	});
}, function(err){
});
