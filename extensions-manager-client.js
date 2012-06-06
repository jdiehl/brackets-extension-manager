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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    'use strict';

    // The extensions folder
    var extensionDir = "extensions/user/";
    var moduleName = "extensions-manager";

    // Brackets modules
    var ExtensionLoader         = brackets.getModule("utils/ExtensionLoader");
    var client = require("client");

    // Monkey-patch the extension loader
    ExtensionLoader.unloadExtension = function (name, baseUrl, entryPoint) {
        var libRequire = brackets.libRequire;
        
        var extensionRequire = libRequire.config({
            context: name,
            baseUrl: baseUrl,
            // GET failing isn't enough for requirejs, it just waits for a timeout
            // But if there is no unload.js, we don't want to wait a long time
            waitSeconds: 1
        });
        
        // Evil hack to make requirejs forget it ever loaded this extension
        var forgetExtension = function () {
            delete libRequire.s.contexts[name];
        };
        
        var result = new $.Deferred();
        
        // Hook into require.js to get some errors.
        // Would be easier with RequireJS 2.0
        var originalErrorHandler = libRequire.onError;
        libRequire.onError = function (err) {
            libRequire.onError = originalErrorHandler;
            
            console.log("[Extension] Error while unloading " + baseUrl + ": " + err.message);
            forgetExtension();
            result.reject(err);
        };
        
        // Unload the exentions by running unload.js
        console.log("[Extension] starting to unload " + baseUrl);
        extensionRequire([entryPoint], function () {
            console.log("[Extension] finished unloading " + baseUrl);
            forgetExtension();
            result.resolve();
        });
        
        return result.promise();
    };
    
    // load an extension
    function _load(name) {
        ExtensionLoader.loadExtension(name, extensionDir + name, "main");
    }

    // unload an extension
    function _unload(name) {
        return ExtensionLoader.unloadExtension(name, extensionDir + name, "unload");
    }


    // list extensions
    function list(callback) {
        client.send(moduleName, "list", callback);
    }

    // install an extension
    function install(name, callback) {
        client.send(moduleName, "install", name, function (res) {
            _load(name);
            if (callback) { callback(); }
        });
    }

    // uninstall an extension
    function uninstall(name, callback) {
        disable(name, function() {
            client.send(moduleName, "uninstall", name, function (res) {
                if (callback) { callback(); }
            });
        });
    }

    // enable an extension
    function enable(name, callback) {
        client.send(moduleName, "enable", name, function (res) {
            _load(name);
            if (callback) { callback(); }
        });
    }
    
    // disable an extension
    function disable(name, callback) {
        var fn = function () {
            client.send(moduleName, "disable", name, callback);
        };
        // Wait for unload to complete or fail before disabling
        _unload(name).done(fn).fail(fn);
    }

    // update an extension
    function update(name, callback) {
        client.send(moduleName, "update", name, function (res) {
            if (callback) { callback(); }
        });
    }
    
    // update all extensions
    function updateAll(name, callback) {
        client.send(moduleName, "updateAll", function (res) {
            if (callback) { callback(); }
        });
    }
    
    // init the extension client
    function init(callback) {
        client.connect(callback);
    }

    exports.list = list;
    exports.install = install;
    exports.uninstall = uninstall;
    exports.enable = enable;
    exports.disable = disable;
    exports.update = update;
    exports.updateAll = updateAll;
    exports.init = init;
});
