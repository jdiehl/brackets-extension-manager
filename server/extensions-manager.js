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
var databaseURL = __dirname + "/../database.json";

var fs = require("./fs-extension");
var path = require("path");
var exec = require("child_process").exec;
var defer = require("node-promise/promise").defer;

// load and flag extensions
var extensions;
_loadExtensions();

// create an index of the given names
function _indexExtensions(index, names, status) {
	for (var i in names) {
		index[names[i]] = status;
	}
}

// add status flag from the index to the extensions list
function _flagExtensions(extensions, index) {
	for (var i in extensions) {
		var ext = extensions[i];
		ext.status = index[ext.name];
	}
}

function _loadExtensions() {
	extensions = JSON.parse(fs.readFileSync(databaseURL));
	var index = {};
	_indexExtensions(index, fs.readdirSync(pathDisabled), 0); // disabled
	_indexExtensions(index, fs.readdirSync(pathEnabled), 1);     // enabled
	_flagExtensions(extensions, index);
}

function _extensionWithName(name) {
	for (var i in extensions) {
		var ext = extensions[i];
		if (ext.name === name) return ext;
	}
}

function _logError(error) {
	console.error("\033[1m\033[31m[extensions-manager] " + error + "\033[0m");
}

// get list of extensions and flag them as uninstalled, installed, or active
function list() {
	return extensions;
}

// install an extension
function install(name) {
	var ext = _extensionWithName(name);
	if (!ext) return _logError("Extension " + name + "not found");

	// clone the extension repository
	var deferred = defer();
	var process = exec("/usr/bin/git clone " + ext.repository.url + " " + pathDisabled + name, function (res) {
		ext.status = 0;
		enable(name);
		deferred.resolve();
	});

	return deferred.promise;
}

// uninstall an extension
function uninstall(name) {
	var ext = _extensionWithName(name);
	if (!ext) return _logError("Extension " + name + "not found");

	var deferred = defer();
	
    disable(name);
    fs.removeRecursive(pathDisabled + name, function (err) {
		if (err) return deferred.reject(err);
		deferred.resolve();
    });
	delete ext.status;

	return deferred.promise;
}

// enable an extension
function enable(name, ext) {
	if (path.existsSync(pathEnabled + name)) return _logError("Extension " + name + " is already enabled");

	if (!ext) ext = _extensionWithName(name);
	if (!ext) {
		console.error("Extension " + name + " not found");
		return;
	}

	// create link from disabled to enabled
	fs.symlinkSync("../disabled/" + name, pathEnabled + name);
	ext.status = 1;
}

// disable an extension
function disable(name, ext) {
	if (!path.existsSync(pathEnabled + name)) return _logError("Extension " + name + " is not enabled");

	if (!ext) ext = _extensionWithName(name);
	if (!ext) return _logError("Extension " + name + "not found");

	// delete link
	var stats = fs.lstatSync(pathEnabled + name);
	if (!stats.isSymbolicLink()) return _logError("Extension " + name + " is not installed as a link");
	fs.unlinkSync(pathEnabled + name);
	ext.status = 0;
}

// update an extension
function update(name, ext) {
	if (!ext) ext = _extensionWithName(name);
	if (!ext) return _logError("Extension " + name + " not found");
	if (ext.status === undefined) return _logError("Extension " + name + " not installed");

	// run git pull
	var deferred = defer();
	var process = exec("/usr/bin/git pull", {cwd: pathDisabled + name}, function (res) {
		deferred.resolve();
	});

	return deferred.promise;
}

// update an extension
function updateAll() {
	var promises = [];
	for (var i in extensions) {
		var ext = extensions[i];
		if (ext.status === undefined) { continue; }
		promises.push(update(ext.name, ext));
	}
	return $.when.apply(null, promises);
}

// public methods
module.exports = {
	list: list,
	install: install,
	uninstall: uninstall,
	enable: enable,
	disable: disable,
	update: update,
	updateAll: updateAll
};
