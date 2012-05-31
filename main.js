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
    var extensionDir = "extensions/user/";
    var extensionManagerDir = extensionDir + "ExtensionManager/";
    
    // Brackets modules
    var EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        ExtensionLoader         = brackets.getModule("utils/ExtensionLoader");

    // Extension modules
    var client = require("extensions-manager-client");
    
    var $template   = null;

    function _showManager() {
        if (!$template) {
            return;
        }
        
        client.list(function (extensions) {
            var $dialog = $template.clone(true);
            
            var $tabs = $dialog.find(".tabSwitcher");
            var $extensions = $dialog.find(".extensions").addClass("installed");
            var $item = $extensions.find("> div:first").remove();
            
            $tabs.find(".availableTab").click(function () {
                $tabs.find("li.active").removeClass("active");
                $(this).closest("li").addClass("active");
                $extensions.removeClass("installed");
            });
            $tabs.find('.installedTab').click(function () {
                $tabs.find('li.active').removeClass("active");
                $(this).closest("li").addClass("active");
                $extensions.addClass("installed");
            });

            $.each(extensions, function (index, extension) {
                var $extension = $item.clone().appendTo($extensions);
                
                var installed = typeof extension.status !== "undefined";
                var enabled = extension.status === 1;
                // Updating not yet supported
                var uptodate    = true;
                
                $extension
                    .toggleClass("installed", installed)
                    .toggleClass("enabled", enabled)
                    .toggleClass("outdated", !uptodate);
                
                var $checkbox = $extension
                    .find(".installationCheckbox")
                    .attr("checked", enabled)
                    .change(function () {
                        var enable = this.checked;
                        
                        $checkbox.attr("disabled", true);
                        if (installed) {
                            client[enable ? "enable" : "disable"](extension.name, function () {
                                enabled = enable;
                                $extension.toggleClass("enabled", enable);
                                
                                $checkbox.attr("disabled", false);
                            });
                        } else if (enable) {
                            client.install(extension.name, function () {
                                installed = true;
                                $extension.addClass("installed");
                                
                                enabled = true;
                                $extension.addClass("enabled");
                                
                                $checkbox.attr("disabled", false);
                            });
                        } else {
                            $checkbox.attr("disabled", false);
                        }
                    });
                
                $extension.find(".titleField").text(extension.title);
                $extension.find(".descriptionField").text(extension.description);
                $extension.find(".versionField").text(extension.version);
                
                $extension.find(".updateButton").click(function () {
                    alert("Update is not yet implemented");
                });
                $extension.find(".uninstallButton").click(function () {
                    client.uninstall(extension.name, function (res) {
                        installed = false;
                        $extension.removeClass("installed");
                        
                        enabled = false;
                        $extension.removeClass("enabled");
                        $checkbox.attr('checked', false);
                    });
                });
            });
            
            $dialog.find(".modal-footer").hide();
            $dialog.find(".updateAllButton").attr("disabled", true).click(function () {
                alert("Update all is not yet implemented");
            });
    
            $dialog
                .appendTo(window.document.body)
                .modal({
                    backdrop: "static",
                    keyboard: true,
                    show: true
                });
        });
    }

    function _registerShortcut() {
        var commandId = "i10.extension_manager.test_modal";
        CommandManager.register("Test Modal", commandId, _showManager);
        KeyBindingManager.addBinding(commandId, "Ctrl-Shift-E");
    }
    
    function _loadStyle() {
        $("<link rel='stylesheet' type='text/css'>").attr("href", extensionManagerDir + "main.css").appendTo(window.document.head);
    }
        
    function _loadTemplate() {
        $.get(extensionManagerDir + "main.html", function (template) {
            // Append template to a DIV to make .find() work
            $template = $("<div>").append(template).find(".modal");
        });
    }

    // Init the UI
    function init() {
        _loadStyle();
        _loadTemplate();

        client.init(function () {
            // Todo: set up extension manager commands here
            _registerShortcut();
        });
    }

    $(init);
});
