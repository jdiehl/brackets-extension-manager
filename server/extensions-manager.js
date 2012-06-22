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

var pathExtensions = __dirname + "/../../../";
var pathDisabled = pathExtensions + "disabled/";
var pathEnabled = pathExtensions + "user/";
var databaseURL = { host: "jdiehl.github.com", path: "/extensions.json" };

var fs = require("./fs-extension");
var http = require("http");
var path = require("path");
var exec = require("child_process").exec;
var promise = require("node-promise/promise");

// index an array
function _makeIndex(array, indexField) {
	var index = {};
	for (var i in array) {
		var item = array[i];
		index[item[indexField]] = item;
	}
	return index;
}

// set the status for extensions
function _setStatus(extensions, names, status) {
	for (var i in names) {
		var name = names[i];
		if (extensions[name]) extensions[name].status = status;
	}
}

// load and flag extensions
var _extensionsCache;
function _loadExtensions(reload) {
	var deferred = promise.defer();
	if (reload) _extensionsCache = undefined;
	else if (_extensionsCache) {
		// serve the cache
		deferred.resolve(_extensionsCache);
	} else {
		// load extensions.json
		var req = http.request(databaseURL, function(res) {
			data = "";
			res.on("data", function (chunk) {
				data += chunk.toString("utf8");
			});
			res.on("end", function () {
				// parse, index, and flag the extensions data
				data = JSON.parse(data);
				_extensionsCache = _makeIndex(data, "name");
				_setStatus(_extensionsCache, fs.readdirSync(pathDisabled), 0);
				_setStatus(_extensionsCache, fs.readdirSync(pathEnabled), 1);
				deferred.resolve(_extensionsCache);
			});
			res.on("error", deferred.reject.bind(null, deferred));
		});
		req.on("error", deferred.reject.bind(null, deferred));
		req.end();
	}
	return deferred;
}

function _wrap(method) {
	return function(name) {
		var deferred = promise.defer();
		_loadExtensions().then(function (res) {
			if (name) {
				res = res[name];
				if (!res) return promise.reject("Extension " + name + "not found.");
			}
			res = method(res, deferred);
			if (method.length < 2) {
				deferred.resolve(res);
			}
		}, deferred.reject.bind(null, deferred));
		return deferred;
	};
}

// get list of extensions and flag them as uninstalled, installed, or active
function list(extensions) {
	return extensions;
}

// install an extension (git clone)
function install(ext, deferred) {
	var process = exec("git clone " + ext.repository.url + " " + pathDisabled + ext.name, function (res) {
		ext.status = 0;
		enable(ext, deferred);
	});
}

// uninstall (disable and delete) an extension
function uninstall(ext, deferred) {
	if (ext.status === 1) disable(ext);
	fs.removeRecursive(pathDisabled + ext.name, function (err) {
		if (err) return deferred.reject(err);
		delete ext.status;
		deferred.resolve();
	});
}

// enable an extension (create link)
function enable(ext, deferred) {
	if (!path.existsSync(pathEnabled + ext.name)) {
		fs.symlinkSync("../disabled/" + ext.name, pathEnabled + ext.name);
	}
	ext.status = 1;
	deferred.resolve();
}

// disable an extension
function disable(ext, deferred) {
	if (path.existsSync(pathEnabled + ext.name)) {
		var stats = fs.lstatSync(pathEnabled + ext.name);
		if (!stats.isSymbolicLink()) {
			return deferred.reject("Cannot disable extension " + ext.name + ": not installed as symbolic link");
		}
		fs.unlinkSync(pathEnabled + ext.name);
		ext.status = 0;
		deferred.resolve();
	}
}

// update an extension (git pull)
function update(ext, deferred) {
	if (ext.status === undefined) {
		return deferred.reject("Extension " + ext.name + " not installed");
	}
	var process = exec("/usr/bin/git pull", {cwd: pathDisabled + ext.name}, function (res) {
		deferred.resolve();
	});
}

// update an extension
function updateAll(extensions, deferred) {
	var promises = [];
	for (var i in extensions) {
		var ext = extensions[i];
		if (ext.status >= 0) {
			var extDeferred = promise.defer();
			promises.push(extDeferred);
			update(ext, extDeferred);
		}
	}
	promise.all(promises).then(deferred.resolve.bind(null, deferred),
		deferred.reject.bind(null, deferred));
}

// open a URL
function openUrl(url) {
	url = url.replace('"', "\\\"");
	exec('open "' + url + '"');
}

// public methods
module.exports = {
	list: _wrap(list),
	install: _wrap(install),
	uninstall: _wrap(uninstall),
	enable: _wrap(enable),
	disable: _wrap(disable),
	update: _wrap(update),
	updateAll: _wrap(updateAll),
	openUrl: openUrl
};
