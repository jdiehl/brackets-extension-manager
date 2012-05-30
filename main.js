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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    'use strict';

    // Sadly hardcoded for now
    var extensionDir = "extensions/user/ExtensionManager";
    
    // Brackets modules
    var EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager");

    // Extension modules
    var client = require("client");
    
    var database    = null;
    var $template   = null;

    function _showManager() {
        if (!$template) {
            return;
        }
        
        var $dialog     = $template.clone(true);
        var $extensions = $dialog.find(".extensions");
        var $item       = $extensions.find("div:first").remove();
        
        $.each(database, function (index, extension) {
            var $extension = $item.clone().appendTo($extensions);
            
            var enabled     = index === 0;
            var uptodate    = index === 1;
            
            $extension
                .toggleClass("disabled", !enabled)
                .toggleClass("outdated", !uptodate);
            
            $extension
                .find(".installationCheckbox")
                .attr("checked", enabled)
                .change(function () {
                    $extension.toggleClass("disabled", !this.checked);
                });
            
            $extension.find(".titleField").text(extension.title);
            $extension.find(".descriptionField").text(extension.description);
            $extension.find(".versionField").text(extension.version);
            
            $extension.find(".updateButton").click(function () {
                alert("Update is not yet implemented");
            });
            $extension.find(".uninstallButton").click(function () {
                alert("Uninstall is not yet implemented");
            });
        });
        
        $dialog.find(".updateAllButton").click(function () {
            alert("Update all is not yet implemented");
        });


        $dialog
            .appendTo(window.document.body)
            .modal({
                backdrop: "static",
                keyboard: true,
                show: true
            });
    }
    
    function _loadDatabase() {
        $.getJSON(extensionDir + "/database.json", function (json) {
            database = json;
        });
    }
    
    function _registerShortcut() {
        var commandId = "i10.extension_manager.test_modal";
        CommandManager.register("Test Modal", commandId, _showManager);
        KeyBindingManager.addBinding(commandId, "Ctrl-Shift-E");
    }
    
    function _loadStyle() {
        $("<link rel='stylesheet' type='text/css'>").attr("href", extensionDir + "/main.css").appendTo(window.document.head);
    }
        
    function _loadTemplate() {
        $.get(extensionDir + "/main.html", function (template) {
            // Append template to a DIV to make .find() work
            $template = $("<div>").append(template).find(".modal");
        });
    }
    
    // Init the UI
    function init() {
        _loadStyle();
        _loadTemplate();
        _registerShortcut();
        client.send("ExtensionManager", "list", function (res) {
            console.log(res);
        });
    }

    _loadDatabase();
    client.connect(init);
});
