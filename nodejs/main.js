#!/usr/bin/env node
var ws = require("nodejs-websocket")
// var sleep = require('sleep');
var geoip = require('geoip-lite');
// var _ = require('underscore');
// var mysql      = require('mysql');
// var connection = mysql.createConnection({
//   host     : '127.0.0.1',
//   user     : 'root',
//   password : '123456',
//   port     : 3306,
//   database : 'livemap'
// });
var id=0;

var Mock = require('mockjs');
var Random = Mock.Random;
var data = Random.ip();
// 输出结果
console.log(data);


//连接mysql
// connection.connect();

//创建服务器
var server = ws.createServer(function (conn) {
  console.log("New connection")
  conn.on("text", function (str) {
    console.log("Received "+str)
  })
  conn.on("close", function (code, reason) {
    console.log("Connection closed")
  })
}).listen(8085)

//发送实时消息
setInterval(function () {

  try {

      do {
      var a = {
		  clientip: Random.ip(),
		  ipstr: Random.ip(),
		  attacktype: 'Cybercrime',
	  };
          var attack_ll = geoip.lookup(a.clientip);
          var host_ll = geoip.lookup(a.ipstr);
      } while (!(attack_ll && attack_ll.ll && attack_ll.city && host_ll && host_ll.ll && host_ll.city));

      var attackType = a.attacktype;

      var destLoc = {
          lat: attack_ll.ll[0],
          lon: attack_ll.ll[1],
          country: attack_ll.country,
          region: attack_ll.city,
          ip: a.ipstr
      };
      var srcLoc = {
          lat: host_ll.ll[0],
          lon: host_ll.ll[1],
          country: host_ll.country,
          region: host_ll.city,
          ip: a.clientip
      };

      var onLoad = {
          attackType : attackType,
          destLoc : destLoc,
          srcLoc : srcLoc
      }

	  //console.log(host_ll);
      var result = JSON.stringify(onLoad);
      console.log(result);
	  server.connections.forEach(function (conn) {
	    // if (attack_ll && attack_ll.ll && attack_ll.city && host_ll && host_ll.ll && host_ll.city)
	    conn.sendText(result);
	  });
      }
  catch (e) {
    console.log('Error!');
    console.log(e);
  }
}, 500);
