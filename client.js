define(function (require, exports, module) {

	var _socket;
	var _messageId = 1;
	var _messageCallbacks = {};

	function _onmessage(data) {
		if (data.type === "message") {
			var msg = JSON.parse(data.data);
			var id = msg.id;
			if (_messageCallbacks[id]) {
				_messageCallbacks[id](msg.response);
			}
		}
	}

	function connect(onopen, onclose) {
		_socket = new WebSocket("ws://127.0.0.1:8080");
		_socket.onopen = onopen;
		_socket.onmessage = _onmessage;
		_socket.onclose = onclose;
	}

	function send(module, method) {
		var args = Array.prototype.slice.call(arguments, 2);
		var id;
		if (typeof args[args.length - 1] === "function") {
			id = _messageId++;
			_messageCallbacks[id] = args.pop();
		} else {
			id = 0;
		}
		var msg = {
			id: id,
			module: module,
			method: method,
			args: args
		};
		_socket.send(JSON.stringify(msg));
	}


	exports.connect = connect;
	exports.send = send;

});