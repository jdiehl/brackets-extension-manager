#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

// set up the http server and reject all incoming connections by default
var server = http.createServer(function(request, response) {
	response.reject(404);
});
server.listen(8080);

// set up and attach the web socket server
wsServer = new WebSocketServer({ httpServer: server, autoAcceptConnections: false });
wsServer.on('request', function(request) {
	if (!originIsAllowed(request.origin)) {
		request.reject(401);
		return;
	}
	var connection = request.accept();
	console.log("Connected to " + connection.remoteAddress);
	connection.on('message', onSocketMessage.bind(null, connection));
	connection.on('close', function(reasonCode, description) {
		console.log("Disconnected from " + connection.remoteAddress);
	});
});

/**
 * Filter sockect connections by origin (URL)
 */
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

/**
 * Respond to socket messages
 */
function onSocketMessage(connection, data) {
	if (data.type !== "utf8") return;
	try {
		var msg = JSON.parse(data.utf8Data);
		var module = require("./" + msg.module);
		var handler = module[msg.method];
		var response = handler.apply(null, msg.args);
		connection.send(JSON.stringify({ id: msg.id, response: response }));
	} catch (err) {
		console.log(err);
	}
}
