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

(function () {
	"use strict";

	var fs = require("./fs-extension");
	var paths = require("path");
	var http = require("http");
	var spawn = require("child_process").spawn;
	var promise = require("node-promise/promise");

	var pathExtensions = fs.realpathSync(__dirname + "/../../../") + paths.sep;
	var pathDisabled = pathExtensions + "disabled" + paths.sep;
	var pathEnabled = pathExtensions + "user" + paths.sep;
	var databaseURL = { host: "jdiehl.github.com", path: "/extensions.json" };

	// Git executables to consider
	var gitExecutables = ["git"];
	if (process.platform === "win32") {
		gitExecutables.push("git.cmd");
	}
	
	// index an array
	function _makeIndex(array, indexField) {
		var i, index = {};
		for (i in array) {
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
		if (_extensionsCache) {
			// serve the cache
			deferred.resolve(_extensionsCache);
		} else {
			// load extensions.json
			var req = http.request(databaseURL, function(res) {
				var data = "";
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

	function _wrap(method, reload) {
		return function(name) {
			var deferred = promise.defer();
			_loadExtensions(reload).then(function (res) {
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

	// enable an extension (create link)
	function enable(ext, deferred) {
		fs.symlinkSync("../disabled/" + ext.name, pathEnabled + ext.name);
		ext.status = 1;
		deferred.resolve();
	}

	// disable an extension
	function disable(ext, deferred) {
		if (fs.existsSync(pathEnabled + ext.name)) {
			var stats = fs.lstatSync(pathEnabled + ext.name);
			if (!stats.isSymbolicLink()) {
				return deferred.reject("Cannot disable extension " + ext.name + ": not installed as symbolic link");
			}
			fs.unlinkSync(pathEnabled + ext.name);
			ext.status = 0;
			deferred.resolve();
		}
	}

	// install an extension (git clone)
	function install(ext, deferred) {
		function onGitFound(gitExecutable) {
			spawn(gitExecutable, ["clone", ext.repository.url, pathDisabled + ext.name]).on("exit", function (code) {
				if (code !== 0) {
					deferred.reject("Error when running git clone");
					return;
				}
				
				ext.status = 0;
				enable(ext, deferred);
			});
		}
		
		chooseGitExecutable().then(onGitFound, deferred.reject);
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

	// update an extension (git pull)
	function update(ext, deferred) {
		if (ext.status === undefined) {
			deferred.reject("Extension " + ext.name + " not installed");
			return;
		}
		
		function onGitFound(gitExecutable) {
			spawn(gitExecutable, ["pull"], {cwd: pathDisabled + ext.name}).on("exit", function (code) {
				if (code !== 0) {
					deferred.reject("Error when running git pull");
					return;
				}
				deferred.resolve();
			});
		}
		
		chooseGitExecutable().then(onGitFound, deferred.reject);
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
		if (process.platform === "win32") {
			spawn("cmd", ["/c", "start", url]);
		} else if (process.platform === "darwin") {
			spawn("open", [url]);
		} else {
			// http://www.dwheeler.com/essays/open-files-urls.html
			spawn("xdg-open", [url]);
		}
	}

	// Runs the passed executables with the provided args and calls the callback with the first one that exits with code 0
	function testExecutables(executables, args, callback) {
		var results = [];
		
		function processResults() {
			for (var i = 0; i < results.length; i++) {
				if (results[i] === 0) {
					callback(executables[i]);
					return;
				}
			}
			callback(null);
		}
		
		var remaining = 0;
		executables.forEach(function (executable, index) {
			remaining++;
			var process = spawn(executable, args);
			process.on("exit", function(code) {
				results[index] = code;
				if (--remaining === 0) {
					processResults();
				}
			});
		});
	}

	// Git executable to use
	var gitExecutable = null;
	
	function chooseGitExecutable() {
		var deferred = promise.defer();
		
		if (gitExecutable) {
			deferred.resolve(gitExecutable);
			return deferred;
		}

		testExecutables(gitExecutables, ["--version"], function (executable) {
			if (! executable) {
				var error = "Could not find a git executable, tried " + gitExecutables.join(", ");
				console.error(error);
				deferred.reject(error);
			} else {
				gitExecutable = executable;
				deferred.resolve(gitExecutable);
			}
		});
		
		return deferred;
	}

	// public methods
	module.exports = {
		list: _wrap(list, true),
		install: _wrap(install),
		uninstall: _wrap(uninstall),
		enable: _wrap(enable),
		disable: _wrap(disable),
		update: _wrap(update),
		updateAll: _wrap(updateAll),
		openUrl: openUrl
	};

}());