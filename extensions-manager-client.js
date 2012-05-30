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
        var extensionRequire = brackets.libRequire.config({
            context: name,
            baseUrl: baseUrl
        });

        console.log("[Extension] unloading " + baseUrl);
        
        extensionRequire([entryPoint], function () { console.log("[Extension] finished unloading " + baseUrl); });
    };
    
    // load an extension
    function _load(name) {
        ExtensionLoader.loadExtension(name, extensionDir + name, "main");
    }

    // unload an extension
    function _unload(name) {
        ExtensionLoader.unloadExtension(name, extensionDir + name, "unload");
    }


    // list extensions
    function list(callback) {
        client.send(moduleName, "list", callback);
    }

    // install an extension
    function install(name, callback) {
        client.send(moduleName, "install", name, function (res) {
            _load(name);
            if (callback) callback();
        });
    }

    // enable an extension
    function enable(name, callback) {
        client.send(moduleName, "enable", name, function (res) {
            _load(name);
            if (callback) callback();
        });
    }
    
    // disable an extension
    function disable(name, callback) {
        _unload(name);
        client.send(moduleName, "disable", name, callback);
    }
    
    // init the extension client
    function init(callback) {
        client.connect(callback);
    }

    exports.list = list;
    exports.install = install;
    exports.enable = enable;
    exports.disable = disable;
    exports.init = init;
});
