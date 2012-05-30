/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

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
