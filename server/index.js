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

var WebSocketServer = require('ws').Server;

function _logError(error) {
	console.error("\033[1m\033[31m[server] " + error.stack + "\033[0m");
}

// set up the web socket server
var wss = new WebSocketServer({ port:8080 });
wss.on('connection', function (ws) {
	ws.on('message', function (message) {
		// try {
			var messageObj = JSON.parse(message);
			console.log(messageObj.module + "." + messageObj.method + "(" + messageObj.args.join() + ")");
			var module = require("./" + messageObj.module);
			var handler = module[messageObj.method];
			var response = handler.apply(null, messageObj.args);
			if (response && typeof response.then === "function") {
				response.then(function (response) {
					ws.send(JSON.stringify({ id: messageObj.id, response: response }));
				}, function (error) {
					_logError(error);
				});
			} else {
				ws.send(JSON.stringify({ id: messageObj.id, response: response }));
			}
		// } catch (error) {
		// 	_logError(error);
		// }
	});
});